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

async function callStripeCheckout(price) {
    let priceObj = {donationAmount: price};
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
    let priceData = document.getElementById('price');
    let price = parseInt(priceData.value); 

    if (price <= 0) {
        alert("Invalid donation amount. Please enter a donation amount greater than 0.");
        return; 
    }

    callStripeCheckout(price).then((res)=> {
        //testing 
        window.location.href = res.url; 
    }).catch((error) => {
        console.log(error);
    });


}