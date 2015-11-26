'use strict';

import _ from 'lodash';

var users = [
  {
    "name": "Jake",
    "email": "jake@mail.com",
    "phone": "+380990000001",
    "password": "jakepassword1",
    "token": "34c78c30-8c60-11e5-a289-a1b0dea86c7f"
  },
  {
    "name": "Emelie",
    "email": "emelie@mail.com",
    "phone": "+380990000002",
    "password": "emeliepassword1",
    "token": "b7ff5060-8c60-11e5-a289-a1b0dea86c7f"
  },
  {
    "name": "Will",
    "email": "will@mail.com",
    "phone": "+380990000003",
    "password": "willpassword1",
    "token": "6b304290-8e9e-11e5-a56a-e7816e6b51c3"
  }
];

export async function seed(knex) {
  let currentUsers = await knex('user').select('email');
  let usersToInsert = users.reduce((toInsert, user) => {
  if (!_.find(currentUsers, {email: user.email})) {
      toInsert.push(user);
    }
    return toInsert;
  }, []);
  if (usersToInsert.length > 0) {
    await knex('user').insert(usersToInsert);
  }
}