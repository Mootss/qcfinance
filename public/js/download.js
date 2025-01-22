document.getElementById("download-excel-btn").addEventListener("click", async () => {
    downloadForm = document.getElementById("download-form")
    downloadForm.submit()

    const response = await fetch("/download", {
        method: "POST",
        body: downloadForm
    })

    const blob = await response.blob()
    if(response) {
        
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.href = url
        console.log(link)
        link.download = ""
        document.body.appendChild(link)
        link.click()
        // clean up after dwnload
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
})