
const passwordGenerator = (length) => {
    const charset = process.env.CHART_SET_CODE_GENERATOR;
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

module.exports = passwordGenerator