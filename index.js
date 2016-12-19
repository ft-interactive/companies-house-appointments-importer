"use strict";
const fs_1 = require("fs");
const stream_1 = require("stream");
const split2 = require("split2");
function getCompanyStatus(code) {
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
exports.getCompanyStatus = getCompanyStatus;
exports.isPersonRecord = (line) => Number(line.charAt(8)) === 2;
exports.isCompanyRecord = (line) => Number(line.charAt(8)) === 1;
exports.isCorporateBody = (code) => code.toLowerCase() === 'y';
function getAppointmentDateOrigin(code) {
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
exports.getAppointmentDateOrigin = getAppointmentDateOrigin;
function getAppointmentType(code) {
    const result = {
        code,
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
exports.getAppointmentType = getAppointmentType;
function parseDate(value) {
    const dateString = value.trim();
    const cc = dateString.substr(0, 2);
    const yy = dateString.substr(2, 2);
    const mm = dateString.substr(4, 2);
    const dd = dateString.substr(6, 2);
    return `${cc}${yy}-${mm}${dd ? '-' + dd : ''}`;
}
exports.parseDate = parseDate;
function parseDOB(partial, full) {
    if (full.trim())
        return { type: 'full', date: parseDate(full) };
    else
        return { type: 'partial', date: parseDate(partial) };
}
exports.parseDOB = parseDOB;
function parseVariableData(data) {
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
exports.parseVariableData = parseVariableData;
function parseCompanyRecord(line) {
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
exports.parseCompanyRecord = parseCompanyRecord;
function parsePersonRecord(line) {
    return {
        origin: getAppointmentDateOrigin(line.substr(9, 1)),
        type: getAppointmentType(line.substr(10, 2)),
        number: line.substr(12, 12),
        isCorporateBody: exports.isCorporateBody(line.substr(24, 1)),
        appointmentDate: parseDate(line.substr(32, 8)),
        resignationDate: parseDate(line.substr(40, 8)),
        postcode: line.substr(48, 8),
        dob: parseDOB(line.substr(56, 8), line.substr(64, 8)),
        variableData: parseVariableData(line.substr(76, 1125)),
    };
}
exports.parsePersonRecord = parsePersonRecord;
function parseSnapshot(path, condenseRecords = false) {
    if (!path) {
        throw new Error('No file path specified');
    }
    if (!condenseRecords) {
        const parseLine = new stream_1.Transform({
            objectMode: true,
            transform(_line, encoding, callback) {
                const line = _line.toString();
                if (exports.isCompanyRecord(line)) {
                    callback(null, {
                        type: 'company',
                        source: 'snapshot',
                        record: parseCompanyRecord(line),
                    });
                }
                else if (exports.isPersonRecord(line)) {
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
        return fs_1.createReadStream(path)
            .pipe(split2())
            .pipe(parseLine);
    }
    else {
        let currentRecord;
        const parseLine = new stream_1.Transform({
            objectMode: true,
            transform(_line, encoding, callback) {
                const line = _line.toString();
                if (exports.isCompanyRecord(line)) {
                    if (currentRecord) {
                        this.push(currentRecord);
                    }
                    currentRecord = parseCompanyRecord(line);
                }
                else if (exports.isPersonRecord(line)) {
                    currentRecord.officers.records.push(parsePersonRecord(line));
                }
                callback();
            }
        });
        return fs_1.createReadStream(path)
            .pipe(split2())
            .pipe(parseLine);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseSnapshot;
;
