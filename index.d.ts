import { Float16Array } from "@petamoriken/float16";
export declare type TypedArray = Float64Array | Float32Array | typeof Float16Array | BigInt64Array | Int32Array | Int16Array | Int8Array | BigUint64Array | Uint32Array | Uint16Array | Uint8Array;
export declare type Dtype = '<f8' | '<f4' | '<f2' | '<i8' | '<i4' | '<i2' | '<i1' | '|u8' | '|u4' | '|u2' | '|u1';
export declare class DataArray {
    typedArray: TypedArray;
    shape: number[];
    constructor(arrayBuffer: ArrayBuffer, dtype: Dtype, shape: number[]);
    toArray: () => any;
    toJson: () => string;
}
declare const readNumpyFile: (filename: string) => DataArray;
export default readNumpyFile;
