/**
 * Module dependencies.
 */
import uuid from 'node-uuid';
import { run } from './base.controller';
import Base from './base.controller';
import knex from '../knex';

@run
export default class User extends Base {
  constructor() {
    super();
    this.emailRegex = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
    this.passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    this.phoneRegex = /^\+380(\d{9})$/;
    this.nameRegex = /^[a-zA-Z]{3,}([\sa-zA-Z]*)$/;
  }

  /**
   * Login user
   */
  async login(req, res) {
    const { email = '', password = '' } = req.body;

    let user = (await knex('user').select('token').where({ email: email, password: password }))[0];

    if (user) {
      return user;
    }

    res.status(422).send([
      { "field": "email", "message": "Wrong email or password" },
      { "field": "password", "message": "Wrong email or password" }
    ]);
  }

  /**
   * Register user
   */
  async register(req, res) {
    let result = await this._validateUserCreate(req.body);

    if (!result.errors.length) {
      result.user.token = uuid.v1();
      result.user.created_at = new Date().getTime();
      result.user.updated_at = new Date().getTime();
      await knex('user').insert(result.user);
      return { "token": result.user.token };
    }

    res.status(422).send(result.errors);
  }

  /**
   * Get current user
   */
  async getCurrentUser(req) {
    return req.user;
  }

  /**
   * Update current user
   */
  async updateCurrentUser(req, res) {
    req.body.id = req.user.id;
    let result = await this._validateUserUpdate(req.body);

    if (!result.errors.length) {
      if (Object.keys(result.user).length) {
        result.user.updated_at = new Date().getTime();
        await knex('user').update(result.user).where({id: req.user.id});
      }

      req.user = (await knex('user').select(['id', 'name', 'email', 'phone']).where({id: req.user.id}))[0];
      return req.user;
    }

    res.status(422).send(result.errors);
  }

  /**
   * Get users
   */
  async getUsers(req) {
    let { name = '', email = '' } = req.query;

    return await knex('user')
      .select(['id', 'name', 'email', 'phone'])
      .where('name', 'like', `%${name}%`)
      .andWhere('email', 'like', `%${email}%`);
  }

  /**
   * Get user by id
   */
  async getUser(req, res) {
    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let user = (await knex('user').select(['id', 'name', 'email', 'phone']).where({id: req.params.id}))[0];
      if (user) {
        return user;
      }
    }

    res.status(404).send();
  }

  /**
   * Validate user create
   * @param user
   * @returns {{user: {}, errors: Array}}
   * @private
   */
  async _validateUserCreate(user) {
    let validUser = {};
    let errors = [];

    if (!this.emailRegex.exec(user.email)) {
      errors.push({ "field": "email", "message": "Wrong email" });
    } else {
      validUser.email = user.email;
    }

    if((await knex('user').select('id').where({ email: user.email }))[0]) {
      errors.push({ "field": "email", "message": "Email already in use" });
    }

    if (user.phone && !this.phoneRegex.exec(user.phone)) {
      errors.push({ "field": "phone", "message": "Wrong phone" });
    } else if (user.phone) {
      validUser.phone = user.phone;
    }

    if (!this.passwordRegex.exec(user.password)) {
      errors.push({ "field": "password", "message": "Wrong password" });
    } else {
      validUser.password = user.password;
    }

    if (!this.nameRegex.exec(user.name)) {
      errors.push({ "field": "name", "message": "Name should contain at least 3 characters" });
    } else {
      validUser.name = user.name;
    }

    return { user: validUser, errors };
  }

  /**
   * Validate user update
   * @param user
   * @returns {{user: {}, errors: Array}}
   * @private
   */
  async _validateUserUpdate(user) {
    let validUser = {};
    let errors = [];

    if (user.phone && !this.phoneRegex.exec(user.phone)) {
      errors.push({ "field": "phone", "message": "Wrong phone" });
    } else if (user.phone) {
      validUser.phone = user.phone;
    }

    if (user.name && !this.nameRegex.exec(user.name)) {
      errors.push({ "field": "name", "message": "Name should contain at least 3 characters" });
    } else if (user.name) {
      validUser.name = user.name;
    }

    if (user.email && !this.emailRegex.exec(user.email)) {
      errors.push({ "field": "email", "message": "Wrong email" });
    } else if (user.email) {
      validUser.email = user.email;
    }

    if(user.email && (await knex('user').select('id').where({ email: user.email }).andWhere('id', '<>', user.id))[0]) {
      errors.push({ "field": "email", "message": "Email already in use" });
    }

    if (user.current_password) {
      if (!this.passwordRegex.exec(user.new_password)) {
        errors.push({ "field": "new_password", "message": "Wrong new password" });
      }

      if (user.current_password !== (await knex('user').select('password').where({ id: user.id }))[0].password) {
        errors.push({ "field": "current_password", "message": "Wrong current password" });
      }

      if (user.new_password === user.current_password) {
        errors.push({ "field": "new_password", "message": "New password should not be same as current password" });
      }

      validUser.password = user.new_password;
    }

    return { user: validUser, errors };
  }
}