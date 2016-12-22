/**
 * Import Companies House snapshot into Postgres
 *
 * Creates two tables, companies and directors
 */

import { Client } from 'elasticsearch';
import * as glob from 'glob';
import parseSnapshot, { CompaniesHouseRecordPerson, CompaniesHouseRecordCompany } from './index';

let CONNECTION_STRING: string;

// if (!process.env.CONNECTION_STRING) {
//   // const { DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME } = process.env;
//   // CONNECTION_STRING = `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
//   ;
// } else {
//   // CONNECTION_STRING = process.env.CONNECTION_STRING;
// }
const DBINFO = {
  host: 'localhost:9200'
};

const client = new Client(DBINFO);

(async () => {
  function processStream(filename) {
    return new Promise((resolve, reject) => {
      const stream = parseSnapshot(filename, true)
        .on('data', async (data) => {
          stream.pause();
          await client.create({
            id: data.number,
            index: 'companies',
            type: 'company',
            body: data,
          });
          stream.resume();
        })
        .on('finish', () => resolve);
    });
  }

  glob('./data/original/*.dat', (err, files) => {
    const q = files.reduce(async (queue, filename) => {
      await queue;
      try {
        await processStream(filename);
        console.log(`Done ${filename}`);
        return queue;
      } catch (e) {
        console.error(e);
        return queue;
      }
    }, Promise.resolve());

    // Runs after everything's done.
    q.then(() => console.log('Done!'))
    .catch(e => console.error(e));
  });
})();
