/**
 * Convert Companies House's weird appointments format to JSON
 */

import { CheckReturn, CheckParams } from 'runtime-type-checks';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { Transform } from 'stream';
import * as split2 from 'split2';

export function getCompanyStatus(code) {
  const ret = {
    code: code.toLowerCase(),
    description: undefined,
  };

  switch (code.toLowerCase()) {
    case 'c':
      ret.description = 'converted/closed company';
      return ret;
    case 'd':
      ret.description = 'converted/closed company';
      return ret;
    case 'l':
      ret.description = 'converted/closed company';
      return ret;
    case 'r':
      ret.description = 'converted/closed company';
      return ret;
    default:
      ret.description = 'unknown status';
      return ret;
  }
}

export const isPersonRecord = (line) => Number(line.charAt(8)) === 2; // Eighth character is record type. "1" for person.
export const isCompanyRecord = (line) => Number(line.charAt(8)) === 1; // Eighth character is record type. "1" for company.
export const isCorporateBody = code => code.toLowerCase() === 'y';

export function getAppointmentDateOrigin(code) {}
export function getAppointmentType(code) {}
export function parseDate(value) {}
export function parseDOB(partial, full) {}
export function parseVariableData(data) {}

export function parseCompanyRecord(line) {
  return {
    name: line.substr(40).replace('<', '').trim(),
    number: line.substr(0, 8).trim(),
    status: getCompanyStatus(line.substr(9, 1)),
    officers: {
      count: Number(line.substr(32, 4)),
      records: [],
    }
  };
}

export function parsePersonRecord(line) {
  return {
    origin: getAppointmentDateOrigin(line.substr(9, 1)),
    type: getAppointmentType(line.substr(10, 2)),
    number: line.substr(12, 12),
    isCorporateBody: isCorporateBody(line.substr(24, 1)),
    appointmentDate: parseDate(line.substr(32, 8)),
    resignationDate: parseDate(line.substr(40, 8)),
    postcode: line.substr(48, 8),
    dob: parseDOB(line.substr(56, 8), line.substr(64, 8)),
    variableData: parseVariableData(line.substr(76, 1125)),
  };
}


export default function parseSnapshot(path: string): any {
  if (!path) {
    throw new Error('No file path specified');
  }

  let currentRecord;

  const parseLine = new Transform({
    objectMode: true,
    transform(line, encoding, callback) {
      if (isCompanyRecord(line)) {
        if (currentRecord) { // Push the last company object if it's a new companyRow.
          this.push(currentRecord);
        }
        currentRecord = parseCompanyRecord(line);
      } else if (isPersonRecord(line)) {
        currentRecord.officers.records.push(parsePersonRecord(line));
      }
      callback();
    }
  });

  createReadStream(path)
    .pipe(split2())
    .pipe(parseLine)
    .on('data', record => console.dir(record));

  // try {
  //   const data = readFileSync(path, {encoding: 'utf8'});
  //   const rows = data.split('\n');
  //   console.dir(rows[0]);
  //   const headerRow = rows.shift();
  //   const header = {
  //     identifier: headerRow.substr(0, 8),
  //     runNumber: headerRow.substr(9, 4),
  //     date: headerRow.substr(13, 8)
  //   };
  //   console.dir(header);
  //   return [header];
  // } catch (e) {
  //   console.error(e);
  // }

  // const companies = [];
  // rows.forEach(row, indx => {
  //
  // });
};

parseSnapshot('./tmp/Prod195_1754_ew_1.dat');
