export function up(knex) {
  return knex.schema.createTable('item', (table) => {
    table.increments('id').notNullable().primary();
    table.string('title').notNullable();
    table.float('price').notNullable();
    table.string('image');
    table.integer('user_id').notNullable().unsigned().references('user.id');
    table.bigInteger('created_at').defaultTo(Date.now()).notNullable();
    table.bigInteger('updated_at').defaultTo(Date.now()).notNullable();
  });
}

export function down(knex) {
  return knex.schema.dropTable('item');
}