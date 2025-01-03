// last update: 31-dec-2024
// why tf did i write 500 lines in one file instead of using routers fml

/*
TODO:
clean up this messy ahh spaghetti code, use routers / middleware? convert functions into modules
Add a sort option to table to sort by for ex: date/total etc
Add red asterik to ones with discounts
Make HTML table no. padding smaller
Add a floating button to bring user to bottom of page
Add a graph to index page
clean up sales.js and expense.js  /  refactor
cookies?
*/

const express = require("express")
const app = express()
const path = require("path")
const session = require('express-session');
const mongoose = require("mongoose")
const multer = require('multer')
const Sale = require("./models/sale")
const Expense = require("./models/expense")
const dotenv = require("dotenv")
dotenv.config()
const mongoStore = require("connect-mongo")
const PORT = process.env.PORT || 3000

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
// app.use(express.json())

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.get("/", authLogin, async (req, res) => {
    const currentDate =  new Date()
    const queryYear = currentDate.getFullYear()
    const queryMonth = currentDate.getMonth() // 0 based to 1 based

    let salesList
    try {
        salesList = await Sale.find()
            .where('date').gte(new Date(queryYear, queryMonth, 1)) 
            .where('date').lt(new Date(queryYear, queryMonth + 1, 1))
    } catch (e) {
            console.error("Error: ", e)
        }

    let expensesList
    try {
        expensesList = await Expense.find()
            .where('date').gte(new Date(queryYear, queryMonth, 1)) 
            .where('date').lt(new Date(queryYear, queryMonth + 1, 1))
    } catch (e) {
            console.error("Error: ", e)
        }

    let totalExpenses = 0
    expensesList.forEach(expenseItem => { totalExpenses += expenseItem.total })
    let totalSales = 0 
    salesList.forEach(saleItem => { totalSales += saleItem.total })

    totalSales = Math.round(totalSales)
    totalExpenses = Math.round(totalExpenses)


    historyData = {
        year2024: [
            {
                month: "September",
                sales: "27,345",
                expenses: "6,003",
                profit: "21,342"
            },
            {
                month: "October",
                sales: "25,675",
                expenses: "8,216",
                profit: "17,459"
            },
            {
                month: "November",
                sales: "34,655",
                expenses: "9,327",
                profit: "25,328"
            },{
                month: "December",
                sales: "35,810",
                expenses: "7,712",
                profit: "28,098"
            },
        ]
    }
    res.render("index", {
        totalSales, 
        totalExpenses,
        historyData
   })
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

const monthNumToName = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
app.get("/sales", authLogin, async (req, res) => {
    try {    
        const currentDate =  new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1 // 0 based to 1 based

        let queryDate = req.query.date ?? `${currentYear}-${currentMonth}`
        let [queryYear, queryMonth] = queryDate.split('-').map(Number)
        queryMonth -= 1 // idk why this works but it does 

        let monthName = monthNumToName[queryMonth]
        // TLDR: if date inputed, use that, else use current date

        const dateList = createDateList(currentDate)
        let salesList
        try {
            salesList = await Sale.find()
                .where('date').gte(new Date(queryYear, queryMonth, 1)) 
                .where('date').lt(new Date(queryYear, queryMonth + 1, 1))
        } catch (e) {
                console.error("Error: ", e)
            }
        salesList.sort((a, b) => {
            return a.date.getDate() - b.date.getDate()
        })
        let totalSales = 0 // calculate total for all sales
        salesList.forEach(saleItem => { totalSales += saleItem.total })

        res.render("sales", {
            salesList,
            getDateSuffix,
            totalSales,
            monthName, // selected, query month name
            dateList, 
            })
        console.log("(GET SALES)")
    } catch (e) {
        console.log("Error: ", e.message)
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
        const currentDate =  new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1 // 0 based to 1 based

        let queryDate = req.query.date ?? `${currentYear}-${currentMonth}`
        let [queryYear, queryMonth] = queryDate.split('-').map(Number)
        queryMonth -= 1

        let monthName = monthNumToName[queryMonth]

        const dateList = createDateList(currentDate)
        let expensesList
        try {
            expensesList = await Expense.find()
                .where('date').gte(new Date(queryYear, queryMonth, 1)) 
                .where('date').lt(new Date(queryYear, queryMonth + 1, 1))
        } catch (e) {
                console.error("Error: ", e)
            }
            expensesList.sort((a, b) => {
            return a.date.getDate() - b.date.getDate()
        })
        let totalExpenses = 0
        expensesList.forEach(expenseItem => { totalExpenses += expenseItem.total })

        res.render("expenses", {
            expensesList,
            getDateSuffix,
            totalExpenses,
            monthName, // selected, query month name
            dateList, 
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
            monthNum: startDate.getMonth() + 1
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
