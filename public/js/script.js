// date select menu
const selectDate = document.getElementById("select-date")
const selectArrowSVG = document.querySelector(".select-arrow svg")

selectDate.addEventListener("change", () => {
    document.getElementById("date-form").submit()
})
selectDate.addEventListener("click", () => {
    selectArrowSVG.classList.toggle("rotate-arrow")
})
selectDate.addEventListener("mouseleave", () => {
    selectArrowSVG.classList.remove("rotate-arrow")
})