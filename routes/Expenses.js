const express = require("express")
const multer = require("multer")

const Expense = require("../models/expense")
const { authLogin } = require("../utils/helperUtils")
const { getMonthData } = require("../utils/databaseUtils")
const { getDateSuffix } = require("../utils/dateUtils")

const router = express.Router()

router.get("/", authLogin, async (req, res) => { // same thing as sales
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

router.post("/", multer().none(), async (req, res) => {
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

router.delete("/:id", multer().none(), async(req, res) => {
    try {
        const result = await Expense.findByIdAndDelete(req.params.id)
        res.json({ success: true })
        console.log("(DELETE EXPENSE)", result)
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server error" })
    }
})

module.exports = router