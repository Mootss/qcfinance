const express = require("express")
const multer = require("multer")

const Sale = require("../models/sale")
const { authLogin } = require("../utils/helperUtils")
const { getMonthData } = require("../utils/databaseUtils")
const { getDateSuffix } = require("../utils/dateUtils")

const router = express.Router()

router.get("/", authLogin, async (req, res) => {
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

router.post("/", multer().none(), async (req, res) => {
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

router.delete("/:id", multer().none(), async(req, res) => {
    try {
        const result = await Sale.findByIdAndDelete(req.params.id)
        res.json({ success: true })
        console.log("(DELETE SALE)", result)
    } catch (e) {
        console.error(e)
        res.status(500).json({ success: false, message: "server error" })
    }
})

module.exports = router