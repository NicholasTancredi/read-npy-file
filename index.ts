import { readFileSync, existsSync, PathLike } from 'fs'
import nj from 'numjs'
import { Float16Array } from "@petamoriken/float16"

const dataViewToAscii = (dv: DataView) => {
    let out = ""
    for (let i = 0; i < dv.byteLength; i++) {
        const val = dv.getUint8(i)
        if (val === 0) {
            break
        }
        out += String.fromCharCode(val)
    }
    return out
}

const bufferToArrayBuffer = (b: Buffer) => {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

const numEls = (shape: number[]) => {
    if (shape.length === 0) {
        return 1
    } else {
        return shape.reduce((a, b) => a * b)
    }
}

const read = (filename: PathLike): ArrayBuffer => {
    const ret = bufferToArrayBuffer(readFileSync(filename))

    if (ret.byteLength <= 5) {
        throw RangeError(
            `Invalid 'byteLength'='${ret.byteLength}' for a numpy file. It's probably an empty file.`)
    }

    return ret
}

export type TypedArray = Float64Array
    | Float32Array
    | typeof Float16Array
    | BigInt64Array
    | Int32Array
    | Int16Array
    | Int8Array
    | BigUint64Array
    | Uint32Array
    | Uint16Array
    | Uint8Array

export type Dtype = '<f8' | '<f4' | '<f2' | '<i8' | '<i4' | '<i2' | '<i1' | '|u8' | '|u4' | '|u2' | '|u1'

const dtypeTypedArrayMap = {
    '<f8': s => new Float64Array(s),
    '<f4': s => new Float32Array(s),
    '<f2': s => new Float16Array(s),
    '<i8': s => new BigInt64Array(s),
    '<i4': s => new Int32Array(s),
    '<i2': s => new Int16Array(s),
    '<i1': s => new Int8Array(s),
    '|u8': s => new BigUint64Array(s),
    '|u4': s => new Uint32Array(s),
    '|u2': s => new Uint16Array(s),
    '|u1': s => new Uint8Array(s),
}

export class DataArray {
    typedArray: TypedArray
    shape: number[]
    constructor(arrayBuffer: ArrayBuffer, dtype: Dtype, shape: number[]) {
        this.typedArray = dtypeTypedArrayMap[dtype](arrayBuffer)
        this.shape = shape
    }
    toArray = () => nj.array(Array.prototype.slice.call(this.typedArray)).reshape(this.shape).tolist()
    toJson = (): string => JSON.stringify(this.toArray())
}

const readNumpyFile = (filename: PathLike): DataArray => {
    const ab = read(filename)

    const view = new DataView(ab)
    let pos = 0

    // First parse the magic string.
    const byte0 = view.getUint8(pos++)
    const magicStr = dataViewToAscii(new DataView(ab, pos, 5))
    pos += 5

    if (byte0 !== 0x93 || magicStr !== "NUMPY") {
        throw TypeError("Not a numpy file.")
    }

    // Parse the version
    const version = [view.getUint8(pos++), view.getUint8(pos++)].join(".")
    if (version !== "1.0") {
        throw Error("Unsupported version.")
    }

    // Parse the header length.
    const headerLen = view.getUint16(pos, true)
    pos += 2

    // Parse the header.
    // header is almost json, so we just manipulated it until it is.
    //  {'descr': '<f8', 'fortran_order': False, 'shape': (1, 2), }
    const headerPy = dataViewToAscii(new DataView(ab, pos, headerLen))
    pos += headerLen
    const bytesLeft = view.byteLength - pos
    const headerJson = headerPy
        .replace("True", "true")
        .replace("False", "false")
        .replace(/'/g, `"`)
        .replace(/,\s*}/, " }")
        .replace(/,?\)/, "]")
        .replace("(", "[")

    const header = JSON.parse(headerJson)
    const { shape, fortran_order, descr } = header
    const dtype = descr

    if (fortran_order) {
        throw Error("NPY parse error. TODO: Implement the uncommon optional fortran_order.")
    }

    // Finally parse the actual data.
    if (bytesLeft !== numEls(shape) * parseInt(dtype[dtype.length - 1])) {
        throw RangeError("Invalid bytes for numpy dtype")
    }

    if (!(dtype in dtypeTypedArrayMap)) {
        throw Error(`Unknown dtype "${dtype}". Either invalid or requires javascript implementation.`)
    }

    return new DataArray(ab.slice(pos, pos + bytesLeft), dtype, shape)
}

export default readNumpyFile