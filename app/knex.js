import knex from 'knex';
import config from './config';

config.db.connection.database = config.db.database;
export default knex(config.db);

