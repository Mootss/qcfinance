const express = require("express")
const ExcelJS = require("exceljs")

const Sale = require("../models/sale")
const Expense = require("../models/expense")

const { createDateList } = require("../utils/dateUtils")
const { authLogin } = require("../utils/helperUtils")

const router = express.Router()

router.get("/", authLogin, (req, res) => {
    res.render("download")
    console.log("(GET DOWNLOAD)")
})

router.post("/", async (req, res) => {
    let { download } = req.body
    console.log(req.body)
    if (download === "all-sales") {
        const { buffer, filename } = await createSalesExcel()
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.send(buffer)

    } else if (download === "all-expenses") {
        const { buffer, filename } = await createExpensesExcel()
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.send(buffer)
    }
    
    console.log(`(POST DOWNLOAD) ${download}`)
})

async function createSalesExcel() {
    try {
        const workbook = new ExcelJS.Workbook()
        salesList = await Sale.find()
        dateList = createDateList(new Date())

        dateList.forEach((date) => { // create new sheet for each year-month
            // totalForDate = 0
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
    
            // header row
            const tableHeading = sheet.addRow(["No.", "Date", "Description", "QTY", "Rate", "Discount", "Total"])
            tableHeading.font = { bold: true }
    
            sheet.getRow(1).getCell(1).value = `Monthly Sales ${date.monthName} ${date.year}` // re-assigning it since the previous one doesnt work
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
                if (colNumber === 1 || colNumber === 2 || colNumber === 4) { 
                    cell.alignment = { horizontal: "center" }
                }

                if (colNumber >= 5 && colNumber <= 7) { // for column 5, 6, 7 
                    cell.alignment = { horizontal: "right" }
                }

                // if (colNumber === 2) { cell.alignment = { horizontal: "center" } }
                // if (colNumber === 4) { cell.alignment = { horizontal: "center" } }
                // if (colNumber === 5) { cell.alignment = { horizontal: "center" } }
                // if (colNumber === 6) { cell.alignment = { horizontal: "center" } }
                // if (colNumber === 7) { cell.alignment = { horizontal: "center" } }
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
                        total: { formula: `=(D${index+2}*E${index+2})-F${index+2}` },
                    })
                    row.eachCell((cell, colNumber) => { // style row
                        cell.border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        } 
                        if (colNumber === 1 || colNumber === 2 || colNumber === 4) { 
                                cell.alignment = { horizontal: "center" }
                            }

                        if (colNumber >= 5 && colNumber <= 7) { // for column 5, 6, 7 
                                cell.alignment = { horizontal: "right" }
                                cell.numFmt = "#,##0" // adds comma for 000s
                            }
                    })

                    //totalForDate += sale.total
                    index ++ 
                }
            })

            // total row
            totalRow = sheet.addRow(["Total Sales"])
            sheet.mergeCells(`A${totalRow.number}:F${totalRow.number}`)
            sheet.getRow(totalRow.number).getCell(7).value = { formula: `SUM(G3:G${index+1})` } // totalForDate.toLocaleString()
            sheet.getRow(totalRow.number).getCell(7).alignment = { horizontal: "right" }
            sheet.getRow(totalRow.number).getCell(7).numFmt = "#,##0"
            
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
        let filename = `Sales Report (${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}).xlsx`

        const buffer = await workbook.xlsx.writeBuffer()

        return { buffer, filename }
    } catch (error) {
        console.error(error)
    }
}

async function createExpensesExcel() {
    try {
        const workbook = new ExcelJS.Workbook()
        expenseList = await Expense.find()
        dateList = createDateList(new Date())

        dateList.forEach((date) => { // create new sheet for each year-month
            // totalForDate = 0
            const sheet = workbook.addWorksheet(`${date.year} ${date.monthName}`)

            const mainHeading = sheet.addRow([`Daily Expenses ${date.monthName} ${date.year}`]) // idk why but this doesnt work, value doesnt get assigned
            sheet.mergeCells("A1:G1")
            mainHeading.font = { bold: true, size: 14 }
            mainHeading.alignment = { horizontal: "center"}
    
            sheet.columns = [
                { header: "Date", key: "date", width: 10 },
                { header: "QTY", key: "qty", width: 7 },
                { header: "Item Description", key: "description", width: 35 },
                { header: "Unit", key: "unit", width: 7 },
                { header: "Rate", key: "rate", width: 7 },
                { header: "GST", key: "gst", width: 8 },
                { header: "Total", key: "total", width: 10 },
            ] 
    
            // header row
            const tableHeading = sheet.addRow(["Date", "QTY", "Item Description", "Unit", "Rate", "GST", "Total"])
            tableHeading.font = { bold: true }
    
            sheet.getRow(1).getCell(1).value = `Daily Expenses ${date.monthName} ${date.year}` // re-assigning it since the previous one doesnt work
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
                if (colNumber === 1 || colNumber === 2 || colNumber === 4) { 
                    cell.alignment = { horizontal: "center" }
                }

                if (colNumber >= 5 && colNumber <= 7) { // for column 5, 6, 7 
                    cell.alignment = { horizontal: "right" }
                }
            })
            
            index = 1
            expenseList.forEach((expense) => { // add row per obj in list
                if (date.year === new Date(expense.date).getFullYear() &&
                    date.monthNum === new Date(expense.date).getMonth() + 1) { // +1 cuz createDateList() returns 1 based month num
                    
                    row = sheet.addRow({ // add data
                        date: new Date(expense.date),
                        qty: expense.quantity,
                        description: expense.description,
                        rate: parseFloat(expense.rate),
                        unit: expense.unit,
                        gst: { formula: `=(B${index+2}*E${index+2})*(8/100)` },
                        total: { formula: `=(B${index+2}*E${index+2})+F${index+2}` },
                    })
                    row.eachCell((cell, colNumber) => { // style row
                        cell.border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        } 
                        if (colNumber === 1 || colNumber === 2 || colNumber === 4) { 
                                cell.alignment = { horizontal: "center" }
                            }

                        if (colNumber >= 5 && colNumber <= 7) { // for column 5, 6, 7 
                                cell.alignment = { horizontal: "right" }
                                cell.numFmt = "#,##0.00" // adds comma for 000s
                            }
                    })

                    //totalForDate += sale.total
                    index ++ 
                }
            })

            // total row
            totalRow = sheet.addRow(["Total Sales"])
            sheet.mergeCells(`A${totalRow.number}:F${totalRow.number}`)
            sheet.getRow(totalRow.number).getCell(7).value = { formula: `SUM(G3:G${index+1})` } // totalForDate.toLocaleString()
            sheet.getRow(totalRow.number).getCell(7).alignment = { horizontal: "right" }
            sheet.getRow(totalRow.number).getCell(7).numFmt = "#,##0"
            
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
        let filename = `Expenses Report (${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}).xlsx`

        const buffer = await workbook.xlsx.writeBuffer()

        return { buffer, filename }
    } catch (error) {
        console.error(error)
    }
}

module.exports = router