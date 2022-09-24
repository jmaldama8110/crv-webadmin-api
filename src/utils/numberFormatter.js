const formatLocalCurrency = (numero) => {

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

module.exports = formatLocalCurrency;