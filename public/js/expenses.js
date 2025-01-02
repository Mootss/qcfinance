// add expense form
const createExpense = document.getElementById("create-expense-form")
document.getElementById("open-expense-form-btn").addEventListener("click", () => {
    createExpense.showModal()
})
document.getElementById("cancel-expense-form-btn").addEventListener("click", () => {
    createExpense.close()
})
document.getElementById("new-expense-form").addEventListener("submit", async function(e) {
    e.preventDefault()
    const formData = new FormData(this)
    
    try {
        const response = await fetch("/expenses",{
            method: "POST",
            body: formData
        })
        const data = await response.json()
        if(data.success) {
            console.log("new expense added.", data.newExpense)
            const totalRow = document.getElementById("total-row")
            const totalValue = parseFloat(totalRow.cells[5].textContent.replace(/,/g, "")) // gets the value of old total
            
            const allRows = document.querySelectorAll(".records-table tbody tr")
            let oldNoValue = 0
            if (allRows.length > 1) { 
                oldNoValue = parseInt(allRows[allRows.length - 2].cells[0].textContent.replace(".", "")) // gets 2nd last row, get value of old no.
            }

            const newExpenseRow = document.createElement("tr")
            newExpenseRow.setAttribute("data-id", data.newExpenseID)
            newExpenseRow.innerHTML = `
                <td>${oldNoValue + 1}.</td>
                <td>${new Date(data.newExpense.date).getDate()}<sup>${data.newExpense.dateSuffix}</sup></td>
                <td class="col-left">${data.newExpense.description}</td>
                <td class="hide-mobile">${data.newExpense.quantity}</td>
                <td class="hide-mobile">${data.newExpense.rate}</td>
                <td class="hide-mobile">${data.newExpense.unit}</td>
                <td class="hide-mobile">${data.newExpense.gst}</td>
                <td>${data.newExpense.total}</td>
            `
            totalRow.parentNode.insertBefore(newExpenseRow, totalRow)
            console.log(totalRow)
            console.log(totalValue)
            totalRow.cells[5].textContent = (totalValue + data.newExpense.total).toLocaleString()

            createExpense.close()
            this.reset()
        } else {
            console.error("error adding expense: ", data.message)
        }
    } catch (e) {
        console.error("error fetching: ", e)
    }       
})

// delete expense
const deleteExpense = document.getElementById("delete-expense")
let expenseToDelete

document.querySelector(".records-table").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]")
    if (row) {
        expenseToDelete = row
        row.classList.add("selected-row")
        deleteExpense.showModal()
    }
})
document.getElementById("delete-expense-btn").addEventListener("click", async () => { // where deleting happens
    if (expenseToDelete) {
        try {
            const response = await fetch(`/expenses/${expenseToDelete.dataset.id}`,{
                method: "DELETE",
            })
            const data = await response.json()
            if (data.success) {
                const totalRow = document.getElementById("total-row")
                const totalValue = parseFloat(totalRow.cells[5].textContent.replace(/,/g, ""))
                totalRow.cells[5].textContent = (totalValue - expenseToDelete.cells[7].textContent).toLocaleString()
                expenseToDelete.remove()
            }
        } catch (e) {
            console.error("error deleting: ", e)
        }
        deleteExpense.close()
    }
})
document.getElementById("cancel-delete-expense-btn").addEventListener("click", () => {
    deleteExpense.close()
    expenseToDelete.classList.remove("selected-row")
})
