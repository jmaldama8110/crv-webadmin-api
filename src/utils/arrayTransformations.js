function arrayFromStringSize( dataString, length, char){
    const newArray = Array.from(dataString);
    newArray.length = length
    newArray.fill(!!char ? char : '', dataString.length)
    return newArray;
}

module.exports = { arrayFromStringSize }