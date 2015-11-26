/**
 * Module dependencies.
 */
import { run } from './base.controller';
import Base from './base.controller';
import knex from '../knex';
import config from '../config';
import fs from 'fs';
import path from 'path';

@run
export default class Item extends Base {
  constructor() {
    super();
    this.sortableFields = ['price', 'created_at'];
    this.titleRegex = /^[a-zA-Z0-9]{3,}([\sa-zA-Z0-9]*)$/;
  }

  /**
   * Get items
   */
  async getItems(req) {
    let { title = '', user_id, order_by = 'created_at', order_type = 'desc' } = req.query;

    order_type = order_type === 'desc' ? order_type : 'asc';

    if (this.sortableFields.indexOf(order_by) === -1) {
      order_by = 'created_at';
    }

    let query = knex('item')
      .select(['item.id', 'item.title', 'item.price', 'item.image', 'item.user_id', 'item.created_at'])
      .where('item.title', 'like', `%${title}%`);

    query = user_id && this._isNumeric(user_id) ? query.andWhere('item.user_id', '=', user_id) : query;

    return await query.orderBy(`item.${order_by}`, order_type);
  }

  /**
   * Get item
   */
  async getItem(req, res) {
    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let item = (await knex('item').select(['id', 'title', 'price', 'image', 'user_id', 'created_at'])
        .where({id: req.params.id}))[0];
      if (item) {
        return item;
      }
    }

    res.status(404).send();
  }

  /**
   * Update item
   */
  async updateItem(req, res) {
    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let item = (await knex('item').select(['user_id']).where({id: req.params.id}))[0];

      if (item) {
        if (item.user_id !== req.user.id) {
          res.status(403).send();
          return;
        }

        let result = await this._validateItemUpdate(req.body);

        if (!result.errors.length) {
          result.item.updated_at = new Date().getTime();
          if (Object.keys(result.item).length) {
            await knex('item').update(result.item).where({id: req.params.id});
          }

          return (await knex('item').select(['id', 'title', 'price', 'image', 'user_id', 'created_at'])
            .where({id: req.params.id}))[0];
        }

        res.status(422).send(result.errors);
        return;
      }
    }

    res.status(404).send();
  }

  /**
   * Remove item
   */
  async removeItem(req, res) {
    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let item = (await knex('item').select(['user_id']).where({id: req.params.id}))[0];

      if (item) {
        if (item.user_id !== req.user.id) {
          res.status(403).send();
          return;
        }

        await knex('item').where({id: req.params.id}).del();

        return;
      }
    }

    res.status(404).send();
  }

  /**
   * Create new item
   */
  async createItem(req, res) {
    let result = await this._validateItemCreate(req.body);

    if (!result.errors.length) {
      result.item.user_id = req.user.id;
      result.item.created_at = new Date().getTime();
      result.item.updated_at = new Date().getTime();
      let itemId = (await knex('item').insert(result.item))[0];
      return (await knex('item').select(['id', 'title', 'price', 'image', 'user_id', 'created_at'])
        .where({id: itemId}))[0];
    }

    res.status(422).send(result.errors);
  }

  /**
   * Upload image for item
   */
  async uploadImage(req, res) {
    if (req.files.file.size >= config.file.maxSize) {
      fs.unlinkSync(path.resolve(`${config.file.uploads}${req.files.file.name}`));
      res.status(422).send([
        { "field": "file", "message": "The file '" + req.files.file.originalname + "' is too big" }
      ]);
      return;
    }

    if (config.file.types.indexOf(req.files.file.extension) === -1) {
      fs.unlinkSync(path.resolve(`${config.file.uploads}${req.files.file.name}`));
      res.status(422).send([
        { "field": "file", "message": "Wrong file type" }
      ]);
      return;
    }

    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let item = (await knex('item').select(['user_id', 'image']).where({id: req.params.id}))[0];

      if (item) {
        if (item.user_id !== req.user.id) {
          fs.unlinkSync(path.resolve(`${config.file.uploads}${req.files.file.name}`));
          res.status(403).send();
          return;
        }

        if (fs.existsSync(path.resolve(`${config.file.uploads}${item.image}`))) {
          fs.unlinkSync(path.resolve(`${config.file.uploads}${item.image}`));
        }

        await knex('item').update({image: req.files.file.name, updated_at: new Date().getTime()}).where({id: req.params.id});

        return (await knex('item').select(['id', 'title', 'price', 'image', 'user_id', 'created_at'])
          .where({id: req.params.id}))[0];
      }
    }

    fs.unlinkSync(path.resolve(`${config.file.uploads}${req.files.file.name}`));
    res.status(404).send();
  }

  /**
   * Remove image for item
   */
  async removeImage(req, res) {
    req.params.id = +req.params.id;

    if (this._isNumeric(req.params.id)) {
      let item = (await knex('item').select(['user_id', 'image']).where({id: req.params.id}))[0];

      if (item) {
        if (item.user_id !== req.user.id) {
          res.status(403).send();
          return;
        }

        if (fs.existsSync(path.resolve(`${config.file.uploads}${item.image}`))) {
          fs.unlinkSync(path.resolve(`${config.file.uploads}${item.image}`));
        }

        await knex('item').update({image: null, updated_at: new Date().getTime()}).where({id: req.params.id});

        return;
      }
    }

    res.status(404).send();
  }

  /**
   * Validate item create
   * @param item
   * @returns {{item: {}, errors: Array}}
   * @private
   */
  async _validateItemCreate(item) {
    let validItem = {};
    let errors = [];

    if (!item.title) {
      errors.push({ "field": "title", "message": "Title is required" });
    }

    if (!this.titleRegex.exec(item.title)) {
      errors.push({ "field": "title", "message": "Title should contain at least 3 characters" });
    } else {
      validItem.title = item.title;
    }

    if (!item.price) {
      errors.push({ "field": "price", "message": "Price is required" });
    }

    if (!this._isNumeric(item.price)) {
      errors.push({ "field": "price", "message": "Wrong price" });
    } else {
      validItem.price = item.price;
    }

    return { item: validItem, errors };
  }

  /**
   * Validate item update
   * @param item
   * @returns {{item: {}, errors: Array}}
   * @private
   */
  async _validateItemUpdate(item) {
    let validItem = {};
    let errors = [];

    if (item.title && !this.titleRegex.exec(item.title)) {
      errors.push({ "field": "title", "message": "Title should contain at least 3 characters" });
    } else if (item.title) {
      validItem.title = item.title;
    }

    if (item.price && !this._isNumeric(item.price)) {
      errors.push({ "field": "price", "message": "Wrong price" });
    } else if (item.price) {
      validItem.price = item.price;
    }

    return { item: validItem, errors };
  }
}