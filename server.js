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

const dotenv = require("dotenv")
const express = require("express")
const path = require("path")
const session = require("express-session")
const mongoStore = require("connect-mongo")

const Sale = require("./models/sale")
const Expense = require("./models/expense")

const { connectDB, disconnectDB, getMonthData, getAllData } = require("./utils/databaseUtils")

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

const salesRoute = require("./routes/Sales")
const expensesRoute = require("./routes/Expenses")
const downloadRoute = require("./routes/Download")
const loginRoute = require("./routes/Login")

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

    const historyData = await getAllData()

    res.render("index", {
        totalSales, 
        totalExpenses,
        historyData
   })
   console.log("(GET INDEX)")
})

app.use("/sales", salesRoute)
app.use("/expenses", expensesRoute)
app.use("/download", downloadRoute)
app.use("/login", loginRoute)

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