//NOTE: USING LOCAL HOST 5000 FOR DEVELOPMENT
require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeCBUrl = 'http://localhost:5000/stripe/success'; 
const cors = require('cors');

const userClientID = process.env.GOOGLE_CLIENT_ID;
const userClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const userCallBack = process.env.GOOGLE_CALLBACK_URL;

const googleLoginData = {
    clientID: userClientID,
    clientSecret: userClientSecret,
    callbackURL: userCallBack,
    proxy: true
}

passport.use(new GoogleStrategy(googleLoginData, gotProfile));

//start building server pipeline
const app = express();
const dbo = require('./databaseOps.js'); 
const { response } = require('express');

app.use(express.json());
app.use(express.static('public'));

//first stage for debugging
app.use('/', printURL);

app.use(cookieSession({
    maxAge: 6 * 60 * 60 * 1000, // Six hour login time
    keys: ['hanger waldo mercy dance']
}));

//init passport middleware
app.use(passport.initialize());

//calls deserialize user if cookie is valid eventually which we use to check
//for profile in DB 
app.use(passport.session());

//might not need this 
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});


//serve static files at first 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/homepage.html');
});

//serve files from public
app.get('/*', express.static('public'));



//the auth/google call in homepage.html redirs here
app.get('/auth/google', 
    passport.authenticate('google', {scope: ['profile']}));


//redirs here after successfully logged in 
app.get('/auth/accepted', 
    (req, res, next) => {
        console.log("authenticated successfully");
        next();
    },
    //access the users profile info from google and call gotProfile
    passport.authenticate('google'), 
    //we now have cookie for browser 
    (req, res) => {
        console.log("logged in with cookies");
        res.redirect('/donations.html');
    }
);

//logout endpoint 
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/homepage.html');
});

app.get('/*', isAuthenticated, express.static('user'));

app.get('/name', (req, res) => {
    let username = req.user.name; 
    res.json({name: username});
});

/*
ADD NECESSARY ENDPOINTS HERE 
*/

//STRIPE STUFF
app.post('/create-checkout-session', async(req, res)=> {//make it async later
    
    // const newProduct = await stripe.products.create({
    //     name: 'New Donation',
    // });

    // const price = await stripe.prices.create({
    //     unit_amount: req.body.donationAmount,//non negative int in cents
    //     currency: 'usd', //can add dropdown to choose currency later
    //     product: newProduct.id,
    // });



    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Masjid Al Noor Donation',
                    },
                    unit_amount: req.body.donationAmount,
                },
                quantity: 1,
            },
        ],
        payment_method_types: [
            'card',
        ],
        mode: 'payment',
        success_url: stripeCBUrl, //on success callback insert into DB the transaction
        cancel_url: stripeCBUrl, //same thing for now 
    });

    //res.redirect(303, session.url);
    res.json({url: session.url});
});

//change this function later 
app.get('/stripe/success', (req, res) => {
    res.redirect('/success.html');
});
//STRIPE STUFF END 

//end of pipeline 
app.use(fileNotFound);

//start listening 
const listener = app.listen(5000, () => {
    console.log("The static server is listening on port " + listener.address().port);
  });


function printURL(req, res, next) {
    console.log(req.url);
    next();
}

// function for end of server pipeline
function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find ' + url);
}

function isAuthenticated(req, res, next) {
    if (req.user) {
      // user field is filled in in request object
      // so user must be logged in! 
      console.log("user", req.user, "is logged in");
      next();
    } else {
      res.redirect('/homepage.html');  // send response telling
      // Browser to go to login page
    }
}
  

function gotProfile(accessToken, refreshToken, profile, done) {
    console.log("Google profile has arrived", profile);
    // here is a good place to check if user is in DB,
    // and to store him in DB if not already there. 
    // Second arg to "done" will be passed into serializeUser,
    // should be key to get user out of database.
  
    let userid = profile.id;
    let name = profile.name.givenName;
    dbo.insertProfile(userid,name).then(
      console.log("Profile stored in DB")).catch(
      function(error) {
        console.log("error inserting entry:", error);
        response.send("Error inserting");
      }
    );
    done(null, userid);
} 

//apart of servers session setup 
passport.serializeUser((userid, done) => {
    console.log("SerializeUser. Input is", userid);
    done(null, userid);
});

//called by passport.session pipeline on everey HTTP req w a curr session cookie
passport.deserializeUser((userid, done) => {
    console.log("deserializeUser. Input is:", userid);
    // here is a good place to look up user data in database using
    // dbRowID. Put whatever you want into an object. It ends up
    // as the property "user" of the "req" object. 
    let userData = { id:userid, name: "data from user's db row goes here" };


    dbo.userSearch(userid).then((val) => {
        userData = { id:userid, name:val };
        done(null, userData);
    })
    .catch(
        function(error) {
        console.log("error inserting entry:", error);
        response.send("Error inserting");
        }
    );
});

