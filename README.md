# Companies House Appointments Snapshot Importer
## 2016 Ændrew Rininsland, Financial Times

This NodeJS script reads a Companies House appointments database snapshot and outputs it as a stream
of records, suitable for writing to a database via ORM or otherwise.

Using streams has the following benefits:

1. Pause streams during database writes
2. Memory-efficient given the entire dump file isn't loaded into memory before processing

This is written in TypeScript because I like TypeScript, but a transpiled JS version is included.

### Usage:

The default use case involves creating records using two tables, suitable for a RDBMS.
Import the default function and provide a path to a snapshot file:

```javascript
import parseSnapshot from 'companies-house-appointments-importer';

parseSnapshot('./tmp/Prod195_1754_ew_1.dat', false)
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

#### @TODO explain other mode (currently WIP status)
