const formatLocalCurrency = (numero) => {
    
    if( !numero ) return '-'
    const formmatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });

    const numberString = formmatter.formatToParts(numero).map( ( { type, value } ) => {
        // console.log('este es ', type, value)
        switch (type) {
            case 'currency': return '$' ;
            default: return value;
        }
    }).reduce((string, part) => string + part);

    return numberString;
}

const getRounded = (data) => {
    const factor = 100;
    return Math.round( (data + Number.EPSILON) * factor ) / factor

}

module.exports = {formatLocalCurrency, getRounded};