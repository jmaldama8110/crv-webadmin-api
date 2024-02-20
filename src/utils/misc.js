"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateYearsMonthsFromDates = exports.arrayFromStringSize = exports.getRounded = exports.formatLocalCurrency = exports.formatLocalDate2 = exports.formatLocalDateShort = exports.formatLocalDate = void 0;
const formatLocalDate = (data) => {
    if (!data)
        return '';
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]), parseInt(dateString[1]) - 1, parseInt(dateString[2]));
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`;
    const yearShort = newDate.getFullYear().toString().slice(-2);
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearShort}`;
};
exports.formatLocalDate = formatLocalDate;
const formatLocalDateShort = (data) => {
    if (!data)
        return '';
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]), parseInt(dateString[1]) - 1, parseInt(dateString[2]));
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    // return `${newDate.getDay()}-${months[newDate.getMonth()]}-${newDate.getFullYear()}`
    return `${newDate.getDate()}/${months[newDate.getMonth()]}`;
};
exports.formatLocalDateShort = formatLocalDateShort;
const formatLocalDate2 = (data) => {
    if (!data)
        return '';
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(parseInt(dateString[0]), parseInt(dateString[1]) - 1, parseInt(dateString[2]));
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`;
    const yearN = newDate.getFullYear().toString();
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearN}`;
};
exports.formatLocalDate2 = formatLocalDate2;
const formatLocalCurrency = (numero) => {
    if (!numero)
        return '-';
    const formmatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
    const numberString = formmatter.formatToParts(numero).map(({ type, value }) => {
        // console.log('este es ', type, value)
        switch (type) {
            case 'currency': return '$';
            default: return value;
        }
    }).reduce((string, part) => string + part);
    return numberString;
};
exports.formatLocalCurrency = formatLocalCurrency;
const getRounded = (data) => {
    const factor = 100;
    return Math.round((data + Number.EPSILON) * factor) / factor;
};
exports.getRounded = getRounded;
function arrayFromStringSize(dataString, length, char) {
    const newArray = Array.from(dataString);
    newArray.length = length;
    newArray.fill(!!char ? char : '', dataString.length);
    return newArray;
}
exports.arrayFromStringSize = arrayFromStringSize;
const calculateYearsMonthsFromDates = (dateSince, dateFrom) => {
    let yearsDiff = dateFrom.getFullYear() - dateSince.getFullYear();
    let monthsDiff = dateFrom.getMonth() - dateSince.getMonth();
    if (monthsDiff < 0) {
        yearsDiff = yearsDiff - 1;
        monthsDiff = monthsDiff + dateSince.getMonth();
    }
    return [yearsDiff, monthsDiff];
};
exports.calculateYearsMonthsFromDates = calculateYearsMonthsFromDates;
