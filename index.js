"use strict";
const fs_1 = require("fs");
const stream_1 = require("stream");
const split2 = require("split2");
function getCompanyStatus(code) {
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
exports.getCompanyStatus = getCompanyStatus;
exports.isPersonRecord = (line) => Number(line.charAt(8)) === 2;
exports.isCompanyRecord = (line) => Number(line.charAt(8)) === 1;
exports.isCorporateBody = code => code.toLowerCase() === 'y';
function getAppointmentDateOrigin(code) { }
exports.getAppointmentDateOrigin = getAppointmentDateOrigin;
function getAppointmentType(code) { }
exports.getAppointmentType = getAppointmentType;
function parseDate(value) { }
exports.parseDate = parseDate;
function parseDOB(partial, full) { }
exports.parseDOB = parseDOB;
function parseVariableData(data) { }
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
function parseSnapshot(path) {
    if (!path) {
        throw new Error('No file path specified');
    }
    let currentRecord;
    const parseLine = new stream_1.Transform({
        objectMode: true,
        transform(line, encoding, callback) {
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
    fs_1.createReadStream(path)
        .pipe(split2())
        .pipe(parseLine)
        .on('data', record => console.dir(record));
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseSnapshot;
;
parseSnapshot('./tmp/Prod195_1754_ew_1.dat');
