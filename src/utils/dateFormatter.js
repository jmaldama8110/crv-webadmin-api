const formatLocalDate = (data) =>{
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(dateString[0],dateString[1]-1, dateString[2]);

    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    return `${newDate.getDate()}/${months[newDate.getMonth()]}/${newDate.getFullYear()}`

}
const formatLocalDateShort = (data) =>{

    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(dateString[0],dateString[1]-1, dateString[2]);
    
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    // return `${newDate.getDay()}-${months[newDate.getMonth()]}-${newDate.getFullYear()}`
    return `${newDate.getDate()}/${months[newDate.getMonth()]}`

}

module.exports = { formatLocalDate, formatLocalDateShort}