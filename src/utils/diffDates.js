const calculateYearsMonthsFromDates = ( dateSince, dateFrom ) => {
    let yearsDiff = dateFrom.getFullYear() - dateSince.getFullYear();
    let monthsDiff = dateFrom.getMonth() - dateSince.getMonth();

    if( monthsDiff < 0){
        yearsDiff = yearsDiff - 1;
        monthsDiff = monthsDiff + dateSince.getMonth();
    }
    return [yearsDiff, monthsDiff];
}

module.exports = {calculateYearsMonthsFromDates}