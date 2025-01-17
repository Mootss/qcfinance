// database functions

const mongoose = require("mongoose")
const Sale = require("../models/sale")
const Expense = require("../models/expense")
const { monthNumToName, createDateList } = require("./dateUtils")

async function connectDB () {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGODB_CONNECT_URI)
            console.log("MongoDB connected!")
        } catch (error) {
            console.log(error)
        }
        
    }      
}

async function disconnectDB () {
    await mongoose.disconnect()
    console.log("MongoDB disconnected!")
}

async function getMonthData(model, inputDate) { // takes inputDate as "year-month" format
    const currentDate =  new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // 0 based to 1 based

    const queryDate = inputDate || `${currentYear}-${currentMonth}`
    let [queryYear, queryMonth] = queryDate.split('-').map(Number)
    queryMonth -= 1 // i forgot why this works but it does 
    // TLDR: if date inputed use that, else use current date

    let dataList
    try {
        dataList = await model.find()
            .where('date').gte(new Date(queryYear, queryMonth, 1)) 
            .where('date').lt(new Date(queryYear, queryMonth + 1, 1))
    } catch (e) {
            console.error("Error: ", e)
        }

    dataList.sort((a, b) => {
        return a.date.getDate() - b.date.getDate()
    })

    let total = 0 
    dataList.forEach(item => { total += item.total }) // calculate total
    
    const monthName = monthNumToName[queryMonth]
    const dateList = createDateList(currentDate)

    return { dataList, total, dateList, monthName }
}

async function getHistoryData() { // horribily inefficient, future me pls refactor
    let historyData = []
    const dateList = createDateList(new Date())

    for (let i = 0; i < dateList.length; i++) {
        salesData = await getMonthData(Sale, `${dateList[i].year}-${dateList[i].monthNum}`)
        expensesData = await getMonthData(Expense, `${dateList[i].year}-${dateList[i].monthNum}`)

        historyData.push({
            year: dateList[i].year,
            month: dateList[i].monthName,
            sales: Math.round(salesData.total).toLocaleString(),
            expenses: Math.round(expensesData.total).toLocaleString(),
            profit: Math.round((salesData.total - expensesData.total)).toLocaleString(),
        })
    }

    return historyData
}

async function createSale(data) {
    try {
        await Sale.create(data)
    } catch (e) {
        console.log("Error: ", e.message)
    }
}

async function uploadSalesJSON() { // to upload existing data to db, slow asf but it works so idc
    try {
        connectDB()
        const salesJSON = require("./salesData.json")
        for (let i=0; i < salesJSON.length; i++) {
            const dateJSON = salesJSON[i].Date
            const dateObj = new Date(`${dateJSON}z`)
            console.log(dateObj)
            await Sale.create({
                date: dateObj,
                description: salesJSON[i].Description,
                quantity: salesJSON[i].Quantity,
                rate: salesJSON[i].Rate,
                discount: salesJSON[i].Discount,
                total: salesJSON[i].Total 
            })
        }   

    } catch (e) {
        console.log("Error ", e)
        res.status(500).send('Database error')
    } finally {
        await mongoose.disconnect();
        console.log('Connection closed!')
    } 
}

async function uploadExpensesJSON() {
    try {
        connectDB()
        const expensesJSON = require("./expensesData.json")
        for (let i=0; i < expensesJSON.length; i++) {
            const dateJSON = expensesJSON[i].Date
            const dateObj = new Date(`${dateJSON}z`)
            console.log(dateObj)
            await Expense.create({
                date: dateObj,
                description: expensesJSON[i].Description,
                quantity: expensesJSON[i].Quantity,
                rate: expensesJSON[i].Rate,
                unit: expensesJSON[i].Unit,
                gst: expensesJSON[i].GST,
                total: expensesJSON[i].Total 
            })
        }   

    } catch (e) {
        console.log("Error ", e)
    } finally {
        await mongoose.disconnect();
        console.log('DATA TRANSFERRED TO MONGODB')
    } 
}

module.exports = { connectDB, disconnectDB, getMonthData, getHistoryData }