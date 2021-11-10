'use strict'

// using a Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// SQL commands for DonationsTable
const insertDB = "insert into DonationsTable (googleuserid, message, date, amount) values (?,?,?,?)";
const getOneDB = "select * from DonationsTable where message = ? and date = ? and amount = ?";
const allDB = "select * from DonationsTable where message = ?";
const insertProfileDB = "insert into Profile (googleuserid, fname) values (?,?)";
// for debug
const fullDB = "select * from DonationsTable";
const fullProfileDB = "select * from Profile";
async function testDB () {

  // for testing, always use today's date
  const today = new Date().getTime();

  // all DB commands are called using await

  // empty out database - probably you don't want to do this in your program
  await db.deleteEverything();

//remove this 
  await db.run(insertDB,["running",today,2.4]);
  await db.run(insertDB,["walking",today,1.1]);
  await db.run(insertDB,["walking",today,2.7]);
//remove above
  console.log("inserted two items");

  // look at the item we just inserted
  let result = await db.get(getOneDB,["running",today,2.4]);
  console.log(result);

  // get multiple items as a list
  result = await db.all(allDB,["walking"]);
  console.log(result);
}

async function insertDonation(userid,newEntry) {
  console.log("insert");
  await db.run(insertDB,[userid,newEntry.message, newEntry.date, newEntry.amount]);
}

async function insertProfile(userid,name){
  console.log(typeof userid);
  console.log(typeof name);
  var userid_str = "'"+userid+"'";
  var name_str = "'"+name+"'";
  const cmd = "select * from Profile where googleuserid = "+userid_str; 
  console.log('cmd insert:',cmd)
  let result = await db.all(cmd);
  console.log("result:", result);

  if(!(result.length > 0)){
    await db.run(insertProfileDB,[userid,name]);
  }else{
    return {};
  }

}

async function userSearch(userinfo){
  var userid_str = "'"+userinfo+"'";
  const cmd = "select * from Profile where googleuserid = "+userid_str;
  
  let result = await db.all(cmd);
  console.log("userSearch:",result[0].fname);
  return await result[0].fname;
}

// return the whole DB to debug
async function full() {
  let result = await db.all(fullDB);
  console.log(result);
  return result;
}

async function full2() {
  let result = await db.all(fullProfileDB);
  console.log(result);
  return result;
}

//returns array of all donations and messages 
async function allUserDonations(userinfo) {
    var userid_str = "'"+userinfo+"'";

    const getChartDB = "select * from DonationsTable where googleuserid = "+userid_str+"  ORDER BY date ";
    let result = await db.all(getChartDB);
    const returnChart = new Array;

    for (var i = 0; i < result.length; i++) {
        var chartReturn = {
            message : result[i].message,
            date : result[i].date,
            amount : result[i].amount
          }
          returnChart[i] = chartReturn;
    }
    return(JSON.stringify(returnChart));
}


module.exports.testDB = testDB;
module.exports.insertDonation = insertDonation;
module.exports.full = full;
module.exports.full2 = full2;
module.exports.allUserDonations = allUserDonations; 
module.exports.insertProfile = insertProfile;
module.exports.userSearch = userSearch;