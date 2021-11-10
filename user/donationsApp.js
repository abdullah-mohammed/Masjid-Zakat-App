'use strict';

let paymentButton = document.getElementById('submitPayment');
paymentButton.addEventListener('click', paymentButton_onclick);

window.addEventListener('load', (event) => {
    initName();
});

async function getName() {
    let name = await fetch('/name');
    
    if (name.ok) {
        return name.json(); 
    } else {
        console.log(error); 
    }
}

function initName() {
    let nameField = document.getElementById('nameSlot');
    
    getName().then((res) => {
        nameField.textContent = res.name + "!"; 
    }).catch( (error) => {
        console.log(error);
    });
}

async function callStripeCheckout(price, messageSent) {
    let priceObj = {donationAmount: price, message: messageSent};
    let sendingData = {
        body: JSON.stringify(priceObj),
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    }

    let response = await fetch('/create-checkout-session', sendingData);

    if (response.ok) {
        console.log("stripe checkout success");
        return response.json(); 
    } else {
        console.log(error);
    }
}

function paymentButton_onclick() {
    let regExpFloat = /^\d+\.\d+$/; 
    let regExpInt = /^\d+$/;
    let priceData = document.getElementById('price');
    let messageSent = document.getElementById('message').value;

    if (priceData.value === "") {
        alert("Please fill out all the fields.");
        return; 
    } else {
        let regExp = (priceData.value.indexOf('.') != -1) ? regExpFloat : regExpInt;

        if (!regExp.test(priceData.value)) { 
            alert("Please input a number.");
            return; 
        }
    }

    let price = parseFloat(priceData.value); 
    //round to at most 2 decimal places and then convert to cents 
    price = (Math.round(price * 100)/100) * 100; 

    if (price <= 50) {
        alert("Invalid donation amount. Please enter a donation amount greater than $0.50.");
        return; 
    }

    callStripeCheckout(price, messageSent).then((res)=> {
        window.location.href = res.url; 
    }).catch((error) => {
        console.log(error);
    });
}
