"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var numjs_1 = __importDefault(require("numjs"));
var float16_1 = require("@petamoriken/float16");
var dataViewToAscii = function (dv) {
    var out = "";
    for (var i = 0; i < dv.byteLength; i++) {
        var val = dv.getUint8(i);
        if (val === 0) {
            break;
        }
        out += String.fromCharCode(val);
    }
    return out;
};
var bufferToArrayBuffer = function (b) {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
var numEls = function (shape) {
    if (shape.length === 0) {
        return 1;
    }
    else {
        return shape.reduce(function (a, b) { return a * b; });
    }
};
var read = function (filename) {
    var fn = fs_1.existsSync(filename) ? filename : __dirname + "/" + filename;
    if (!fs_1.existsSync(fn)) {
        throw Error("FileNotFound: \"" + fn + "\" nor \"" + filename + "\" exist.");
    }
    var ret = bufferToArrayBuffer(fs_1.readFileSync(fn));
    if (ret.byteLength <= 5) {
        throw RangeError("Invalid 'byteLength'='" + ret.byteLength + "' for a numpy file. It's probably an empty file.");
    }
    return ret;
};
var dtypeTypedArrayMap = {
    '<f8': function (s) { return new Float64Array(s); },
    '<f4': function (s) { return new Float32Array(s); },
    '<f2': function (s) { return new float16_1.Float16Array(s); },
    '<i8': function (s) { return new BigInt64Array(s); },
    '<i4': function (s) { return new Int32Array(s); },
    '<i2': function (s) { return new Int16Array(s); },
    '<i1': function (s) { return new Int8Array(s); },
    '|u8': function (s) { return new BigUint64Array(s); },
    '|u4': function (s) { return new Uint32Array(s); },
    '|u2': function (s) { return new Uint16Array(s); },
    '|u1': function (s) { return new Uint8Array(s); },
};
var DataArray = /** @class */ (function () {
    function DataArray(arrayBuffer, dtype, shape) {
        var _this = this;
        this.toArray = function () { return numjs_1.default.array(Array.prototype.slice.call(_this.typedArray)).reshape(_this.shape).tolist(); };
        this.toJson = function () { return JSON.stringify(_this.toArray()); };
        this.typedArray = dtypeTypedArrayMap[dtype](arrayBuffer);
        this.shape = shape;
    }
    return DataArray;
}());
exports.DataArray = DataArray;
var readNumpyFile = function (filename) {
    var ab = read(filename);
    var view = new DataView(ab);
    var pos = 0;
    // First parse the magic string.
    var byte0 = view.getUint8(pos++);
    var magicStr = dataViewToAscii(new DataView(ab, pos, 5));
    pos += 5;
    if (byte0 !== 0x93 || magicStr !== "NUMPY") {
        throw TypeError("Not a numpy file.");
    }
    // Parse the version
    var version = [view.getUint8(pos++), view.getUint8(pos++)].join(".");
    if (version !== "1.0") {
        throw Error("Unsupported version.");
    }
    // Parse the header length.
    var headerLen = view.getUint16(pos, true);
    pos += 2;
    // Parse the header.
    // header is almost json, so we just manipulated it until it is.
    //  {'descr': '<f8', 'fortran_order': False, 'shape': (1, 2), }
    var headerPy = dataViewToAscii(new DataView(ab, pos, headerLen));
    pos += headerLen;
    var bytesLeft = view.byteLength - pos;
    var headerJson = headerPy
        .replace("True", "true")
        .replace("False", "false")
        .replace(/'/g, "\"")
        .replace(/,\s*}/, " }")
        .replace(/,?\)/, "]")
        .replace("(", "[");
    var header = JSON.parse(headerJson);
    var shape = header.shape, fortran_order = header.fortran_order, descr = header.descr;
    var dtype = descr;
    if (fortran_order) {
        throw Error("NPY parse error. TODO: Implement the uncommon optional fortran_order.");
    }
    // Finally parse the actual data.
    if (bytesLeft !== numEls(shape) * parseInt(dtype[dtype.length - 1])) {
        throw RangeError("Invalid bytes for numpy dtype");
    }
    if (!(dtype in dtypeTypedArrayMap)) {
        throw Error("Unknown dtype \"" + dtype + "\". Either invalid or requires javascript implementation.");
    }
    return new DataArray(ab.slice(pos, pos + bytesLeft), dtype, shape);
};
exports.default = readNumpyFile;
