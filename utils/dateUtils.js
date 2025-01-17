// date functions

const monthNumToName = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function createDateList(currentDate) { // takes date obj, returns list of dates available for query
    let startDate = new Date(2024, 8, 1) // start: 2024 september
    let dateList = []
    while (
        startDate.getFullYear() < currentDate.getFullYear() ||
        (startDate.getFullYear() === currentDate.getFullYear() && startDate.getMonth() <= currentDate.getMonth()))
    {
        dateList.push({
            year: startDate.getFullYear(),
            monthName: monthNumToName[startDate.getMonth()],
            monthNum: startDate.getMonth() + 1 // 0 to 1 based????
        })
        startDate.setMonth(startDate.getMonth() + 1) // incrementing month, until match current date
    }
    return dateList
}

function getDateSuffix(date) { // returns date suffix
    const day = date.getDate()
    let suffix = "th"
    if (day % 10 === 1 && day !== 11) {
        suffix = "st"
    } else if (day % 10 === 2 && day !== 12) {
        suffix = "nd"
    } else if (day % 10 === 3 && day !== 13) {
        suffix = "rd"
    }

    return suffix
}

module.exports = { monthNumToName, createDateList, getDateSuffix }