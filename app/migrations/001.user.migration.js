export function up(knex) {
  return knex.schema.createTable('user', (table) => {
    table.increments('id').notNullable().primary();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('phone');
    table.string('password').notNullable();
    table.uuid('token').notNullable();
    table.bigInteger('created_at').defaultTo(Date.now()).notNullable();
    table.bigInteger('updated_at').defaultTo(Date.now()).notNullable();
  });
}

export function down(knex) {
  return knex.schema.dropTable('user');
}