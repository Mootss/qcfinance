document.getElementById("download-excel-btn").addEventListener("click", async () => {
    downloadForm = document.getElementById("download-form")
    downloadForm.submit()

    const response = await fetch("/download/excel")

    const blob = await response.blob();
    if(response) {
        console.log("skibbidi")
        
        // Create a temporary link element to trigger the download
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob); // Create a URL for the blob
        link.href = url;
        link.download = "Sales Report.xlsx"; // Set the default download filename
        document.body.appendChild(link);
        link.click(); // Programmatically click the link to start the download
        document.body.removeChild(link); // Clean up by removing the link
        URL.revokeObjectURL(url); // Revoke the URL object to free up memory
    }
})