// add sale form
const createSale = document.getElementById("create-sale-form")
document.getElementById("open-sale-form-btn").addEventListener("click", () => {
    createSale.showModal()
})
document.getElementById("cancel-sale-form-btn").addEventListener("click", () => {
    createSale.close()
})
document.getElementById("new-sale-form").addEventListener("submit", async function(e) {
    e.preventDefault()
    const formData = new FormData(this)
    
    try {
        const response = await fetch("/sales",{
            method: "POST",
            body: formData
        })
        const data = await response.json()
        if(data.success) {
            console.log("new sale added.", data.newSale)
            const totalRow = document.getElementById("total-row")
            const totalValue = parseFloat(totalRow.cells[4].textContent.replace(/,/g, "")) // gets the value of old total
            
            const allRows = document.querySelectorAll(".records-table tbody tr")
            console.log(allRows)
            console.log(allRows.length)
            let oldNoValue = 0
            if (allRows.length > 1) { 
                oldNoValue = parseInt(allRows[allRows.length - 2].cells[0].textContent.replace(".", "")) // gets 2nd last row, get value of old no.
            }
            // why did i write everyhting on 1 line? bec more pain for future me reading these

            const newSaleRow = document.createElement("tr")
            newSaleRow.setAttribute("data-id", data.newSaleID)
            newSaleRow.innerHTML = `
                <td>${oldNoValue + 1}.</td>
                <td>${new Date(data.newSale.date).getDate()}<sup>${data.newSale.dateSuffix}</sup></td>
                <td class="col-left">${data.newSale.description}</td>
                <td class="hide-mobile">${data.newSale.quantity}</td>
                <td class="hide-mobile">${data.newSale.rate}</td>
                <td class="hide-mobile">${data.newSale.discount}</td>
                <td>${data.newSale.total}</td>
            `
            totalRow.parentNode.insertBefore(newSaleRow, totalRow)
            totalRow.cells[4].textContent = (totalValue + data.newSale.total).toLocaleString()

            createSale.close()
            this.reset()
        } else {
            console.error("error adding sale: ", data.message)
        }
    } catch (e) {
        console.error("error fetching: ", e)
    }       
})

// delete sale
const deleteSale = document.getElementById("delete-sale")
let saleToDelete

document.querySelector(".records-table").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]")
    if (row) {
        saleToDelete = row
        row.classList.add("selected-row")
        deleteSale.showModal()
    }
})
document.getElementById("delete-sale-btn").addEventListener("click", async () => { // where deleting happens
    if (saleToDelete) {
        try {
            const response = await fetch(`/sales/${saleToDelete.dataset.id}`,{
                method: "DELETE",
            })
            const data = await response.json()
            if (data.success) {
                const totalRow = document.getElementById("total-row")
                const totalValue = parseFloat(totalRow.cells[4].textContent.replace(/,/g, ""))
                totalRow.cells[4].textContent = (totalValue - saleToDelete.cells[4].textContent).toLocaleString()
                saleToDelete.remove()
            }
        } catch (e) {
            console.error("error deleting: ", e)
        }
        deleteSale.close()
    }
})
document.getElementById("cancel-delete-sale-btn").addEventListener("click", () => {
    deleteSale.close()
    saleToDelete.classList.remove("selected-row")
})
