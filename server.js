// last update: 04-jan-2025
// why tf did i write 500 lines in one file instead of using routers fml

/*
TODO:
clean up this messy ahh spaghetti code, use routers / middleware? convert functions into modules
Add a sort option to table to sort by for ex: date/total etc
Add red asterik to ones with discounts
Add a floating button to bring user to bottom of page
Add a graph to index page
cookies?
*/

const express = require("express")
const app = express()
const path = require("path")
const session = require('express-session')
const mongoose = require("mongoose")
const multer = require('multer')
const Sale = require("./models/sale")
const Expense = require("./models/expense")
const dotenv = require("dotenv")
dotenv.config()
const mongoStore = require("connect-mongo")
const ExcelJS = require("exceljs")
const PORT = process.env.PORT || 3000

const monthNumToName = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

app.use(session({
    secret: "SuperDuperSecretThalhudhandi",
    resave: false,
    saveUninitialized: false,
    store: mongoStore.create({
        mongoUrl: process.env.MONGODB_CONNECT_URI
    })
}))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.get("/", authLogin, async (req, res) => {
    let totalSales = await getMonthData(Sale)
    let totalExpenses = await getMonthData(Expense)
    totalSales = Math.round(totalSales.total)
    totalExpenses = Math.round(totalExpenses.total)

    const historyData = await getHistoryData()

    res.render("index", {
        totalSales, 
        totalExpenses,
        historyData
   })
   console.log("(INDEX)")
})


app.get("/login", (req, res) => {
    res.render("login")
}) 
app.post("/login", (req, res) => {
    // TODO: store hash in env 
    const crypto = require("crypto")
    const hash = crypto.createHash('sha256').update(req.body.password).digest('hex')
    
    if (hash === process.env.PASSWORD_HASH) {
        req.session.isLoggedIn = true
        res.redirect("/")
        console.log("(SUCCESS) Login")
    } else {
        res.render('login', { incorrectPass: true })
        console.log("(FAIL) Login")
        // TODO: fix this rendering bug, maybe replace alert() with success/error modal
    }
}) 

app.get("/sales", authLogin, async (req, res) => {
    try {    
        data = await getMonthData(Sale, req.query.date)
        const [salesList, totalSales, monthName, dateList] = [data.dataList, data.total, data.monthName, data.dateList]

        res.render("sales", {
            salesList,
            totalSales,
            monthName, // selected, query month name
            dateList, 
            getDateSuffix, // func
            })
        console.log("(GET SALES)")
    } catch (e) {
        console.log("Error: ", e)
    } 
})
app.post("/sales", multer().none(), async (req, res) => {
    let { newSaleDate, newSaleDescription, newSaleQTY, newSaleRate, newSaleDiscount } = req.body
    let newSaleDateObject = new Date(newSaleDate)
    // console.log(req.body)
    try {
        const newSale = {
            date: newSaleDateObject,
            description: newSaleDescription,
            quantity: Number(newSaleQTY) || 1,
            rate: Number(newSaleRate) || 0,
            discount: Number(newSaleDiscount) || 0,
            total: (newSaleQTY * newSaleRate) - newSaleDiscount
        }
        let newSaleMDB = new Sale(newSale)
        newSaleMDB = await newSaleMDB.save()
        //console.log(newSaleMDB._id)

        newSale.dateSuffix = getDateSuffix(newSaleDateObject)
        // console.log(newSale)
        res.json({ 
            success: true,
            newSale: newSale,
            newSaleID: newSaleMDB._id
        })
        console.log("(POST SALE) ", newSaleMDB)
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server eorr" })
    } 
})
app.delete("/sales/:id", multer().none(), async(req, res) => {
    try {
        const result = await Sale.findByIdAndDelete(req.params.id)
        console.log("(DELETE SALE)", result)

        res.json({ success: true })
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server error" })
    }
})


app.get("/expenses", authLogin, async (req, res) => { // ctrl c ctrl v  app.get(/sales)
    try {    
        data = await getMonthData(Expense, req.query.date)
        const [expensesList, totalExpenses, monthName, dateList] = [data.dataList, data.total, data.monthName, data.dateList]

        res.render("expenses", {
            expensesList,
            totalExpenses,
            monthName, // selected, query month name
            dateList, 
            getDateSuffix,
            })
        console.log("(GET EXPENSES)")
    } catch (e) {
        console.log("Error: ", e)
    } 
})
app.post("/expenses", multer().none(), async (req, res) => {
    const { newExpenseDate, newExpenseDescription, newExpenseQTY, newExpenseRate, newExpenseUnit } = req.body
    const newExpenseDateObject = new Date(newExpenseDate)
    const gst = (newExpenseQTY * newExpenseRate) * (8/100)
    //    console.log(req.body)
    try {
        const newExpense = {
            date: newExpenseDateObject,
            description: newExpenseDescription,
            quantity: Number(newExpenseQTY) || 1,
            rate: Number(newExpenseRate) || 0,
            unit: newExpenseUnit || "",
            gst: gst,
            total: (newExpenseQTY * newExpenseRate) + gst
        }
        let newExpenseMDB = new Expense(newExpense)
        newExpenseMDB = await newExpenseMDB.save()

        newExpense.dateSuffix = getDateSuffix(newExpenseDateObject)

        res.json({ 
            success: true,
            newExpense: newExpense,
            newExpenseID: newExpenseMDB._id
        })
        console.log("(POST EXPENSE) ", newExpenseMDB)
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server eorr" })
    } 
})
app.delete("/expenses/:id", multer().none(), async(req, res) => {
    try {
        const result = await Expense.findByIdAndDelete(req.params.id)
        console.log("(DELETE EXPENSE)", result)

        res.json({ success: true })
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server error" })
    }
})


app.get("/download", authLogin, (req, res) => {
    res.render("download")
})

app.get("/download/excel", async (req, res) => {
    let download = req.query.download
    //res.render("download")
    console.log("(DOWNLOAD)")
    console.log(download)
    if (download === "all-sales") {
        try {

            const workbook = new ExcelJS.Workbook()
            salesList = await Sale.find()
            dateList = createDateList(new Date())
    
            dateList.forEach((date) => { // create new sheet for each year-month
                totalForDate = 0
                const sheet = workbook.addWorksheet(`${date.year} ${date.monthName}`)
    
                const mainHeading = sheet.addRow([`Monthly Sales ${date.monthName} ${date.year}`]) // idk why but this doesnt work, value doesnt get assigned
                sheet.mergeCells("A1:G1")
                mainHeading.font = { bold: true, size: 14 }
                mainHeading.alignment = { horizontal: "center"}
        
                sheet.columns = [
                    { header: "No.", key: "no", width: 5 },
                    { header: "Date", key: "date", width: 10 },
                    { header: "Description", key: "description", width: 35 },
                    { header: "QTY", key: "qty", width: 7 },
                    { header: "Rate", key: "rate", width: 10 },
                    { header: "Discount", key: "discount", width: 8 },
                    { header: "Total", key: "total", width: 10 },
                ] 
        
                const tableHeading = sheet.addRow(["No.", "Date", "Description", "QTY", "Rate", "Discount", "Total"])
                tableHeading.font = { bold: true }
        
                sheet.getRow(1).getCell(1).value = "Monthly Sales September 2024" // re-assigning it since the previous one doesnt work
                sheet.getRow(1).getCell(1).fill = {
                    type: "pattern",
                    pattern:"solid",
                    fgColor:{argb: "FFD9D9D9"}      
        
                } 
                sheet.getRow(1).getCell(1).border = {
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                }
        
                tableHeading.eachCell((cell, colNumber) => {
                    cell.fill = {
                        type: "pattern",
                        pattern:"solid",
                        fgColor:{argb: "FFD9D9D9"}
                    }
                    cell.border = {
                        top: {style:'thin'},
                        left: {style:'thin'},
                        bottom: {style:'thin'},
                        right: {style:'thin'}
                    }
                    if (colNumber === 2) { cell.alignment = { horizontal: "center" } }
                    if (colNumber === 4) { cell.alignment = { horizontal: "center" } }
                    if (colNumber === 5) { cell.alignment = { horizontal: "center" } }
                    if (colNumber === 6) { cell.alignment = { horizontal: "center" } }
                    if (colNumber === 7) { cell.alignment = { horizontal: "center" } }
                })
                
                index = 1
                salesList.forEach((sale) => { // add row per obj in list
                    if (date.year === new Date(sale.date).getFullYear() &&
                        date.monthNum === new Date(sale.date).getMonth() + 1) { // +1 cuz createDateList() returns 1 based month num
                        
                        row = sheet.addRow({ // add data
                            no: index,
                            date: new Date(sale.date),
                            description: sale.description,
                            qty: sale.quantity,
                            rate: parseFloat(sale.rate),
                            discount: sale.discount,
                            total: sale.total,
                        })
                        row.eachCell((cell, colNumber) => { // style row
                            cell.border = {
                                top: {style:'thin'},
                                left: {style:'thin'},
                                bottom: {style:'thin'},
                                right: {style:'thin'}
                            }
                            if (colNumber === 1) { cell.alignment = { horizontal: "center" } }
                            if (colNumber === 2) { cell.alignment = { horizontal: "center" } }
                            if (colNumber === 4) { cell.alignment = { horizontal: "center" } }
                            if (colNumber === 5) { cell.alignment = { horizontal: "right" } }
                            if (colNumber === 6) { cell.alignment = { horizontal: "right" } }
                            if (colNumber === 7) { cell.alignment = { horizontal: "right" } }
                        })
    
                        totalForDate += sale.total
                        index ++ 
                    }
                })
                totalRow = sheet.addRow(["Total Sales"])
                sheet.mergeCells(`A${totalRow.number}:F${totalRow.number}`)
                sheet.getRow(totalRow.number).getCell(7).value = totalForDate.toLocaleString()
                sheet.getRow(totalRow.number).getCell(7).alignment = { horizontal: "right" }
                
                totalRow.eachCell((cell) => {
                    cell.fill = {
                        type: "pattern",
                        pattern:"solid",
                        fgColor:{argb: "FFD9D9D9"}      
                    } 
                    cell.border = {
                        top: {style:'thin'},
                        left: {style:'thin'},
                        bottom: {style:'thin'},
                        right: {style:'thin'}
                    }
                    cell.font = { bold: true }
                })
            })

            currentDate = new Date()
            let filename = `All Sales (${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}).xlsx`

            // Write the file to a buffer in memory (instead of writing to disk)
            const buffer = await workbook.xlsx.writeBuffer();

            // Set the appropriate headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Send the Excel file as a response
            res.send(buffer)

            //currentDate = new Date()
            // await workbook.xlsx.writeFile(`All Sales (${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}).xlsx`)
            console.log("EXCEL CREATED (ALL SALES)")
    
        } catch (error) {
            console.error(error)
        }
    }
    else {
        res.render("download")
    }
})


app.listen(PORT, async () => {
    console.log("Server online! PORT: ", PORT)
    await connectDB()
})

// disconnect db
process.on('SIGINT', async () => {
    await disconnectDB()
    process.exit(0)
});

process.on('SIGTERM', async () => {
    await disconnectDB()
    process.exit(0)
});

function authLogin(req, res, next) { // to force the user log in
    if (req.session.isLoggedIn) {
        next()
    } else { res.redirect("/login") }
}

function createDateList(currentDate){ // takes date obj, returns list of dates available for query
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

// database functions
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

async function getHistoryData() {
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