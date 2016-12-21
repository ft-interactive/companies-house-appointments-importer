/**
 * Import Companies House snapshot into Postgres
 *
 * Creates two tables, companies and directors
 */

import * as S from 'sequelize';
import * as glob from 'glob';
import parseSnapshot, { CompaniesHouseRecordPerson, CompaniesHouseRecordCompany } from './index';

let CONNECTION_STRING: string;

if (!process.env.CONNECTION_STRING) {
  const { DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME } = process.env;
  CONNECTION_STRING = `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
} else {
  CONNECTION_STRING = process.env.CONNECTION_STRING;
}

const db = new S(CONNECTION_STRING);

// Define tables
const Company = db.define<CompanyInstance, CompaniesHouseRecordCompany>('company', {
  name: S.STRING,
  number: S.STRING,
  status: S.JSONB,
});

const Director = db.define<DirectorInstance, CompaniesHouseRecordPerson>('director', {
  number: S.STRING,
  origin: S.JSONB,
  type: S.JSONB,
  isCorporateBody: S.BOOLEAN,
  appointmentDate: S.STRING,
  resignationDate: S.STRING,
  postcode: S.STRING,
  dob: S.JSONB,
  variableData: S.JSONB,
  companyNumber: S.STRING,
});

// Setup relationsip
Director.belongsTo(Company);
Company.hasMany(Director);

// Setup a few interfaces...
interface CompanyInstance extends S.Instance<CompaniesHouseRecordCompany> {}
interface DirectorInstance extends S.Instance<CompaniesHouseRecordPerson> {
  setCompany: S.BelongsToSetAssociationMixin<CompanyInstance, string>;
}


(async () => {
  await Company.sync({force: true});
  await Director.sync({force: true});

  function processStream(filename) {
    return new Promise((resolve, reject) => {
      const stream = parseSnapshot(filename)
        .on('data', async (data) => {
          stream.pause();
          if (data.type === 'company') {
            await Company.create(data.record);
          } else if (data.type === 'director') {
            const cNum = data.record.companyNumber;

            const d = await Director.create(data.record);
            const c = await Company.findOne({
              where: {
                number: cNum,
              }
            });

            await d.setCompany(c);
          }
          stream.resume();
        })
        .on('finish', () => resolve);
    });
  }

  glob('./data/**/*.dat', (err, files) => {
    const q = files.reduce(async (queue, filename) => {
      await queue;
      try {
        await processStream(filename);
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
