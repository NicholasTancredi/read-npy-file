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
        // 'typedArray' is a TypedArray. see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
        typedArray: dataArray.typedArray,
        // The shape of the numpy array
        shape: dataArray.shape,
        // Converts the flat TypedArray into a nested normal array equivalent to what it would be in python.
        array: dataArray.toArray(),
        // Converts to json string.
        json: dataArray.toJson(),
    }
)
```