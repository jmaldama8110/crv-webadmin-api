export const formatLocalDate = (data:string) =>{
    if( !data ) return '';  
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]),parseInt(dateString[1])-1, parseInt(dateString[2]));

    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`
    const yearShort = newDate.getFullYear().toString().slice(-2);
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearShort}`
}

export const formatLocalDateShort = (data:string) =>{
    if( !data ) return '';
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]),parseInt(dateString[1])-1, parseInt(dateString[2]));
    
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    // return `${newDate.getDay()}-${months[newDate.getMonth()]}-${newDate.getFullYear()}`
    return `${newDate.getDate()}/${months[newDate.getMonth()]}`

}

export const formatLocalDate2 = (data:string) =>{
    if( !data ) return '';  
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]),parseInt(dateString[1])-1, parseInt(dateString[2]));

    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`
    const yearN = newDate.getFullYear().toString();
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearN}`
}

export const formatLocalCurrency = (numero:number) => {
    
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

export const getRounded = (data:number) => {
    const factor = 100;
    return Math.round( (data + Number.EPSILON) * factor ) / factor

}

export function arrayFromStringSize( dataString:string, length:number, char:string){
    const newArray = Array.from(dataString);
    newArray.length = length
    newArray.fill(!!char ? char : '', dataString.length)
    return newArray;
}

export const calculateYearsMonthsFromDates = ( dateSince:Date, dateFrom: Date ) => {
    let yearsDiff = dateFrom.getFullYear() - dateSince.getFullYear();
    let monthsDiff = dateFrom.getMonth() - dateSince.getMonth();

    if( monthsDiff < 0){
        yearsDiff = yearsDiff - 1;
        monthsDiff = monthsDiff + dateSince.getMonth();
    }
    return [yearsDiff, monthsDiff];
}

export function checkProperty (property:string, obj: any, defaultVal: any) {
    if( property in obj ){ // existe la propiedad?
        // Si existe, es el tipo correcto?
        if( (typeof obj[property] == (typeof defaultVal)) ){
            return true; // property is Ok
        }
    } 
    // obj[property] = defaultVal;
    return false; // property is NOT ok
}




