import db from './knex';
import config from './config';

async function seed() {
  let result = await db.seed.run().tap();

  if (result[0].length === 0) {
    console.log('no seeds were processed');
  }
  else {
    console.log(result[0].length + ' seeds were processed');
  }

  process.exit();
}

export default seed();