# read-npy-file
## Install
```sh
npm i read-npy-file
```

## Usage
```ts
import readNumpyFile from 'read-npy-file'
const dataArray = readNumpyFile('data.npy')
console.log(
    {
        // The DataArray result
        dataArray,
        // 'typedArray' is a raw flat TypedArray from the buffer
        // Will be a different typed array based on the numpy dtype - such as Float64Array, Int32Array, Uint8Array, ect
        typedArray: dataArray.typedArray,
        // the shape of the numpy array
        shape: dataArray.shape,
        // Converts the flat TypedArray input a nested normal array.
        array: dataArray.toArray(),
        // Converts to json
        json: dataArray.toJson(),
    }
)
```