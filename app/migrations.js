import knex from 'knex';
import config from './config';

async function migrate() {
  await knex(config.db).raw(`CREATE DATABASE IF NOT EXISTS ${config.db.database}`);

  config.db.connection.database = config.db.database;
  let db = knex(config.db);

  let result = await db.migrate.latest().tap();

  if (result[1].length === 0) {
    console.log('no new migrations were processed');
  }
  else {
    console.log(result[1].length + ' migrations were processed');
  }

  process.exit();
}

export default migrate();