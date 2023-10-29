const formatLocalDate = (data) =>{
    if( !data ) return '';  
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(dateString[0],dateString[1]-1, dateString[2]);

    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`
    const yearShort = newDate.getFullYear().toString().slice(-2);
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearShort}`
}
const formatLocalDate2 = (data) =>{
    if( !data ) return '';  
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(dateString[0],dateString[1]-1, dateString[2]);

    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const dayIs = newDate.getDate();
    const dayWithCero = dayIs < 10 ? `0${dayIs}` : `${dayIs}`
    const yearN = newDate.getFullYear().toString();
    return `${dayWithCero}/${months[newDate.getMonth()]}/${yearN}`
}
const formatLocalDateShort = (data) =>{
    if( !data ) return '';
    const dateString = data.split('T')[0].split('-');
    const newDate = new Date(dateString[0],dateString[1]-1, dateString[2]);
    
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    // return `${newDate.getDay()}-${months[newDate.getMonth()]}-${newDate.getFullYear()}`
    return `${newDate.getDate()}/${months[newDate.getMonth()]}`

}

module.exports = { formatLocalDate, formatLocalDateShort, formatLocalDate2}