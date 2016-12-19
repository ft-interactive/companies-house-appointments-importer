/**
 * Convert Companies House's weird appointments format to JSON
 */

import { CheckReturn, CheckParams } from 'runtime-type-checks';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { Transform } from 'stream';
import * as split2 from 'split2';



// To test, uncomment:
parseSnapshot('./tmp/Prod195_1754_ew_1.dat').on('data', (data) => console.dir(data));




/**
 * Get company status from code
 * @param  {string} code Company status code. One of C, D, L, R or (space).
 * @return {CompaniesHouseCodeWithValue}      An object containing the code (lowercase) and its description.
 */
export function getCompanyStatus(code: string): CompaniesHouseCodeWithValue {
  const ret = {
    code: code.toLowerCase(),
    status: '',
  };

  switch (code.toLowerCase()) {
    case 'c':
      ret.status = 'converted/closed company';
      return ret;
    case 'd':
      ret.status = 'converted/closed company';
      return ret;
    case 'l':
      ret.status = 'converted/closed company';
      return ret;
    case 'r':
      ret.status = 'converted/closed company';
      return ret;
    case ' ':
    default:
      ret.status = 'unknown status';
      return ret;
  }
}

/**
 * Checks whether line indicates the following record is for a person
 * @param  {string} line          First line of a record
 * @return {boolean}              Whether record is a snaptshot person record
 */
export const isPersonRecord = (line: string) => Number(line.charAt(8)) === 2; // Eighth character is record type. "2" for person

/**
 * Checks whether line indicates the following record is for a company
 * @param  {string} line          First line of a record
 * @return {boolean}              Whether record is a snaptshot company record
 */
export const isCompanyRecord = (line: string) => Number(line.charAt(8)) === 1; // Eighth character is record type. "1" for company

/**
 * Checks whether a director is a corporate body (i.e., value is 'Y')
 * @param {string} code           Either a string containing 'Y' or empty string
 * @return {boolean}              Whether director is a corporate body
 */
export const isCorporateBody = (code: string) => code.toLowerCase() === 'y';

/**
 * Parse an appointment date origin code into an object
 * @param  {string} code  Appointment date origin code
 * @return {CompaniesHouseCodeWithValue}      Object containing code and description
 */
export function getAppointmentDateOrigin(code: string): CompaniesHouseCodeWithValue {
  const result = {
    code: Number(code),
    source: '',
  };

  switch (result.code) {
    case 1:
      result.source = 'appointment documents (288a, AP01, AP02, AP03, AP04, RR01 NI form 296, SEAP01 or SEAP02)';
      break;
    case 2:
      result.source = 'annual return (form 363)';
      break;
    case 3:
      result.source = 'incorporation documents (form 10, IN01, NI form 21, SEFM01, SEFM02, SEFM03, SEFM04, SEFM05, SECV01 or SETR02)';
      break;
    case 4:
      result.source = 'LLP appointment documents (LLP288a, LLAP01, LLAP02 or NI form LLP296a)';
      break;
    case 5:
      result.source = 'LLP incorporation documents (LLP2 or LLIN01)';
      break;
    case 6:
      result.source = 'overseas company appointment documents (BR4, OSAP01, OSAP02, OSAP03 or OSAP04)';
      break;
  }

  return result;
}

/**
 * Parse an appointment type from code
 * @param  {string}                      code Appointment type code
 * @return {CompaniesHouseCodeWithValue}      Object containing appointment type code and description
 */
export function getAppointmentType(code: string): CompaniesHouseCodeWithValue {
  const result = {
    code, // Not typed to Number here to preserve leading zero
    status: '',
  };

  switch (code) {
    case '00':
      result.status = 'Current Secretary';
      break;
    case '01':
      result.status = 'Current Director';
      break;
    case '04':
      result.status = 'Current non-designated LLP Member';
      break;
    case '05':
      result.status = 'Current designated LLP Member';
      break;
    case '11':
      result.status = 'Current Judicial Factor';
      break;
    case '12':
      result.status = 'Current Receiver or Manager appointed under the Charities Act';
      break;
    case '13':
      result.status = 'Current Manager appointed under the CAICE Act';
      break;
    case '17':
      result.status = 'Current SE Member of Administrative Organ';
      break;
    case '18':
      result.status = 'Current SE Member of Supervisory Organ';
      break;
    case '19':
      result.status = 'Current SE Member of Management Organ';
      break;
  }

  return result;
}

/**
 * Parse a date value into quasi-ISO-8601 format
 * @param  {string} value Date string
 * @return {string}       Quasi-ISO-8601 date format string,
 *                        either yyyy-mm-dd or yyyy-mm depending on `value`
 */
export function parseDate(value: string) {
  const dateString = value.trim();
  const cc = dateString.substr(0, 2);
  const yy = dateString.substr(2, 2);
  const mm = dateString.substr(4, 2);
  const dd = dateString.substr(6, 2); // Will be empty string if partial date.

  return `${cc}${yy}-${mm}${dd ? '-' + dd : ''}`;
}

/**
 * Parse full and/or partial DOB into a single string
 * @param  {string} partial Partial DOB string in YYYYMM format
 * @param  {string} full    Full DOB string in YYYYMMDD format
 * @return {string}         Date string in quasi-ISO-8601 format (YYYY-MM-DD, or YYYY-MM if partial only)
 */
export function parseDOB(partial: string, full: string) {
  if (full.trim()) return {type: 'full', date: parseDate(full) };
  else return {type: 'partial', date: parseDate(partial) };
}

/**
 * Parse Companies House's weird variable date format
 * @param  {string} data                     Variable data string
 * @return {CompaniesHouseVariableData}      Parsed variable data object
 */
export function parseVariableData(data: string): CompaniesHouseVariableData {
  const items = data.split('<');
  return {
    title: items[0] || null,
    forenames: items[1] || null,
    surname: items[2] || null,
    honours: items[3] || null,
    careOf: items[4] || null,
    POBox: items[5] || null,
    address: `${items[6]}${items[7] ? '\n' + items[7] : ''}` || null,
    town: items[8] || null,
    county: items[9] || null,
    country: items[10] || null,
    occupation: items[11] || null,
    nationality: items[12] || null,
    countryOfResidence: items[13] || null,
  };
}

/**
 * Create Companies House company record from snapshot data
 * @param  {string} line Line from a Companies House snapshot dump
 * @return {CompaniesHouseRecordCompany}      Company record
 */
export function parseCompanyRecord(line: string): CompaniesHouseRecordCompany {
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

/**
 * Create Companies House person record from snapshot data
 * @param  {string}                     line Line from a Companies House snapshot dump
 * @return {CompaniesHouseRecordPerson}      Person record
 */
export function parsePersonRecord(line: string): CompaniesHouseRecordPerson {
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

/**
 * Parse a snapshot into a stream of records
 * @param  {string} path            Path to snapshot file to parse
 * @param  {string} condenseRecords Whether to condense company records into a single entry (WIP)
 * @return {stream}                 ✨ ...a magical stream of records! ✨
 */
export default function parseSnapshot(path: string, condenseRecords = false): any {
  if (!path) {
    throw new Error('No file path specified');
  }

  if (!condenseRecords) {
    const parseLine = new Transform({
      objectMode: true,
      transform(_line, encoding, callback) {
        const line = _line.toString(); // Received as string|Buffer otherwise
        if (isCompanyRecord(line)) {
          callback(null, {
            type: 'company',
            source: 'snapshot',
            record: parseCompanyRecord(line),
          });
        } else if (isPersonRecord(line)) {
          const record = parsePersonRecord(line);
          record.companyNumber = line.substr(0, 8);
          callback(null, {
            type: 'person',
            source: 'snapshot',
            record,
          });
        }
      }
    });

    return createReadStream(path)
      .pipe(split2())
      .pipe(parseLine);
  }

  // This might not work as it's entirely dependent upon records being in sequential order
  else {
    let currentRecord;

    const parseLine = new Transform({
      objectMode: true,
      transform(_line, encoding, callback) {
        const line = _line.toString(); // Received as string|Buffer otherwise
        if (isCompanyRecord(line)) {
          if (currentRecord) { // Push the last company object if it's a new companyRow
            this.push(currentRecord);
          }
          currentRecord = parseCompanyRecord(line);
        } else if (isPersonRecord(line)) {
          currentRecord.officers.records.push(parsePersonRecord(line));
        }
        callback();
      }
    });

    return createReadStream(path)
      .pipe(split2())
      .pipe(parseLine);
  }
};

interface CompaniesHouseCodeWithValue {
  code: string | number;
  status?: string;
  source?: string;
}

interface CompaniesHouseVariableData {
  title: string | null;
  forenames: string | null;
  surname: string | null;
  honours: string | null;
  careOf: string | null;
  POBox: string | null;
  address: string | null;
  town: string | null;
  county: string | null;
  country: string | null;
  occupation: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
}

interface CompaniesHouseRecordCompany {
  name: string;
  number: string;
  status: CompaniesHouseCodeWithValue;
  officers: {
    count: number;
    records: Array<CompaniesHouseRecordPerson>;
  };
}

interface CompaniesHouseRecordPerson {
  companyNumber?: string;
  origin: CompaniesHouseCodeWithValue;
  type: CompaniesHouseCodeWithValue;
  number: string;
  isCorporateBody: boolean;
  appointmentDate: string;
  resignationDate: string;
  postcode: string;
  dob: {
    type: string;
    date: string;
  };
  variableData: CompaniesHouseVariableData;
}
