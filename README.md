# Companies House Appointments Snapshot Importer
## 2016 Ændrew Rininsland, Financial Times

This NodeJS script reads a Companies House appointments database snapshot and outputs it as a stream
of records, suitable for writing to a database via ORM or otherwise.

Using streams has the following benefits:

1. Pause streams during database writes
2. Memory-efficient given the entire dump file isn't loaded into memory before processing

This is written in TypeScript because I like TypeScript, but a transpiled JS version is included.

### Usage:

The default use case involves creating records using two tables, suitable for either NoSQL or RDBMS.
Import the default function and provide a path to a snapshot file:

```javascript
import parseSnapshot from 'companies-house-appointments-importer';

parseSnapshot('./data/Prod195_1754_ew_1.dat', false)
  .on('data', record => {
    // Write record to database here.
    //
    // record: {
    //  type: 'person' | 'company';
    //  source: 'snapshot';
    //  record: CompaniesHouseRecordPerson | CompaniesHouseRecordCompany
    // };
  });
```

The other use case involves parsing the "person" records into a child object of the "company" record.
Pass `true` as the second argument to return this type.
```javascript
import parseSnapshot from 'companies-house-appointments-importer';

parseSnapshot('./data/Prod195_1754_ew_1.dat', true)
  .on('data', record: CompaniesHouseRecordCompany => {
    // Write record to database here, using the following schema:
    // interface CompaniesHouseRecordCompany {
    //   name: String,
    //   number: String,
    //   status: CompaniesHouseCodeWithValue,
    //   officers: {
    //     count: Number,
    //     records: []<CompaniesHouseRecordPerson>,
    //   }
    // }
    //
    // interface CompaniesHouseRecordPerson {
    //   companyNumber: string;
    //   origin: CompaniesHouseCodeWithValue;
    //   type: CompaniesHouseCodeWithValue;
    //   number: string;
    //   isCorporateBody: boolean;
    //   appointmentDate: string;
    //   resignationDate: string;
    //   postcode: string;
    //   dob: {
    //     type: string;
    //     date: string;
    //   };
    //   variableData: CompaniesHouseVariableData;
    // }
    //
    // interface CompaniesHouseCodeWithValue {
    //   code: string | number;
    //   status?: string;
    //   source?: string;
    // }
    //
    // interface CompaniesHouseVariableData {
    //   title: string | null;
    //   forenames: string | null;
    //   surname: string | null;
    //   honours: string | null;
    //   careOf: string | null;
    //   POBox: string | null;
    //   address: string | null;
    //   town: string | null;
    //   county: string | null;
    //   country: string | null;
    //   occupation: string | null;
    //   nationality: string | null;
    //   countryOfResidence: string | null;
    // }
  });
```

Reference implementations for both Elasticsearch and Postgres are provided, as
import-elasticsearch.ts and import-postgres.ts respectively.

### Split and modify Companies House snapshots
A shell script is provided that will merge all of a single region's snapshots into one file,
as well as sort and split it into a separate file for directors and companies. If using Postgres,
it is recommended to do this and run the import in two separate batches: companies first, then
officers/directors. This is necessary if you want to use the Company Number as the primary key.

### TODO
- [ ] Write unit tests
