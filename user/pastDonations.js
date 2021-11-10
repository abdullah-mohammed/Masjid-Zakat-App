
let columnNames = ["Date", "Amount Donated", "Message"];
const tableDiv = document.getElementById("tableDiv");

window.addEventListener('load', (event) => {
    loadDonationHistory();
});

function intializeAltText() {
    //empty the div 
    while (tableDiv.firstChild) {
        tableDiv.removeChild(tableDiv.firstChild);
    }

    let altText = document.createElement("h2");
    altText.className = "altTextStyle";
    altText.textContent = "No past donations. Please return to the home screen to make a donation!";

    tableDiv.append(altText);
}

function initializeTable(userArray) {
    //empty the div 
    while (tableDiv.firstChild) {
        tableDiv.removeChild(tableDiv.firstChild);
    }
    
    //create table and fill rows 
    let donationsTable = document.createElement("table");
    donationsTable.className = "donationsTable";

    let dTableHead = document.createElement("thead");
    dTableHead.className = "dTableHead";

    let dTableBody = document.createElement("tbody");
    dTableBody.className = "dTableBody";

    //create header columns 
    columnNames.forEach((name) => {
        let colLabel = document.createElement("th");
        colLabel.textContent = name; 
        dTableHead.append(colLabel);
    });

    //fill out body 
    userArray.forEach((rowObj) => {
        let newRow = document.createElement("tr");
        let newDate = document.createElement("td"); 
        let dateConverted = new Date(rowObj.date);
        newDate.textContent = (dateConverted.getMonth() + 1) + '/' + dateConverted.getDate() + '/' + dateConverted.getFullYear(); 
        let newAmount = document.createElement("td");
        let amountConverted = (Math.round(rowObj.amount * 100)/100).toFixed(2);
        newAmount.textContent = '$' + amountConverted; 
        let newMessage = document.createElement("td"); 
        newMessage.textContent = rowObj.message; 
        
        newRow.append(newDate);
        newRow.append(newAmount);
        newRow.append(newMessage);

        dTableBody.append(newRow);
    });

    donationsTable.append(dTableHead);
    donationsTable.append(dTableBody);

    tableDiv.append(donationsTable);
}

async function getPaymentHistory() {
    let dataJSON = await fetch('/payment-history');

    if (dataJSON.ok) {
        return dataJSON.json();
    } else {
        console.log(error);
    }
}

function loadDonationHistory() {
    getPaymentHistory().then((dataArr) => {
        //console.log(dataArr);
        if (dataArr.length > 0) {
            initializeTable(dataArr);
        } else {
            //some alt text html 
            intializeAltText();
        }

    }).catch((error) => {
        console.log(error);
    });
}