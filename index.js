
// https://vast-peak-63221.herokuapp.com/

var express = require('express') //a minimal and flexible Node.js web application framework that provides a robust set of features to develop web and mobile applications.
, bodyParser = require('body-parser'); //this is a node.js middleware for handling JSON, Raw, Text and URL encoded form data.

var http = require('http');
var request = require('request');

var fs = require('fs'); //to read files

//nodejs server online port
const PORT = process.env.PORT || 5000;

//Chatbot facebook page, access token
const FB_PAGE_ACCESS_TOKEN = 'EAAFLoV6ANvIBADadfOI0WWJ0ZBSd3cAO5Vm5GCpDYrjw4MPKu8OIh5tyv9hwHzoATCQGdM2z2xck4Mmg3kW4V8yzGQVvLCULnNC5nkGn9kLZBrQJZCPGPYZAWAFBlZB0FqBgEUYC7crwJfiQ5MuUEaViBZBzZCDq2TitfieKLuduAZDZD';

//DialogFlow intent actions
const ACTION_GETTING_STARTED = 'action_getting_started';
const ACTION_ENUM_CONFIRMED = 'action_eNum_confirmed';
const ACTION_ADD_USER_TO_DB = 'action_add_user';
const ACTION_CHECK_SEMESTER = 'action_check_semester';
const ACTION_WELCOME = '';

//postgres database url
const DATABASE_URL = 'postgres://dcfvnzofeempgk:2c027d6f6788c5b82e4cbb9e9d388254211a61156d1fc1e35312c8c5885958aa@ec2-107-22-167-179.compute-1.amazonaws.com:5432/d3teg1g8u2anm';

var app = express(); //getting an express instance , app?

const { Client } = require('pg');

//database connection information? database instance
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: true,
});

var facebookID = '';
var firstName = '';
var lastName = '';
var eNumber = '';
var fieldOfStudy = '';
var semester = 0;

client.connect(); //connecting to the database? client database instance

app.use(bodyParser.json());
app.set('view engine', 'pug');    // set a view engine to show reults in web browser
app.get('/', (req, res) => res.render('pages/index'));

//incomming request, resulting response
app.post('/', function(request, res){

  let action = request.body.result.action; //getting the value of the action of incomming request
  console.log(action);

  if(action == ACTION_GETTING_STARTED){
    facebookID = request.body.originalRequest.data.sender.id;//the facebook id

	  //getFacebookData function was implemented in this js file.
    getFacebookData(facebookID, function(err, data){
      firstName = data.first_name; //first name, from the facebook account
      lastName = data.last_name; //last name, from the facebook account
      var firstMsg = `Hi ${firstName}`;
      res.send(JSON.stringify({
                    "messages": [{"type": 0, "speech": firstMsg},
                                 {"type": 0, "speech": "I'm a Informational Chat bot for Pera Efac"},
                                 {"type": 0, "speech": "To get started, tell me your registration number"}]
      }))
    });
  }
  /*
  if(action == ACTION_CHECK_SEMESTER){

    console.log(request.body.result);

    semester = request.body.result.parameters.semesterNum || request.body.result.parameters.semesterOrd;

    if(semester > 0 && semester < 3){
      // first year student
      eNumber = request.body.result.parameters.eNumber;
      fieldOfStudy = 'General';
      let query = `INSERT INTO userInfo VALUES(${facebookID}, '${firstName}', '${lastName}', '${eNumber}',
                    '${fieldOfStudy}', ${semester});`;

      console.log(query);

      client.query(query, function(err, result) {
        if (err){
          console.error(err);
          response.send("Error " + err);
        }else{
          console.log(result.rows);
        }
      });

      let reply = `Ah.. That's great! Now you can ask me anything.` || `Good to go! How can I help you?`;

      res.header('Content-Type', 'application/json');

      res.send(JSON.stringify({"messages": [{"type": 0, "speech": reply}]},
                              {"context": [{"name":"semester", "lifespan":10, "parameters":null}]}))

    }else if (semester < 9) {
      // ask for Fields
      res.send(JSON.stringify({"data": { "facebook": {
                                "text": "What is your Field ?",
                                "quick_replies": [{ "content_type": "text", "title": "Com", "payload": "com"},
                                                  { "content_type": "text", "title": "Elec", "payload": "elec"},
                                                  { "content_type": "text", "title": "Civil", "payload": "civil"},
                                                  { "content_type": "text", "title": "Mec", "payload": "mec"},
                                                  { "content_type": "text", "title": "Chem", "payload": "chem"},
                                                  { "content_type": "text", "title": "Prod", "payload": "prod"}]}}},
                                {"contextOut": [{"name":"semester", "lifespan":0, "parameters":{}},
                                                {"name":"chooseField", "lifespan":5, "parameters":{}}]}))

    }else {
      // invalid semester

      let reply = `Something wrong with your Semester` || `Invalid Semester, check again`;

      res.send(JSON.stringify({"messages": [{"type": 0, "speech": reply}]},
                              {"contextOut": [{"name":"semester", "lifespan":2, "parameters":{}}]}))
    }

  }
  */

  if(action == ACTION_ADD_USER_TO_DB){

    eNumber = request.body.result.parameters.eNumber;
    fieldOfStudy = request.body.result.parameters.fields;
    semester = request.body.result.parameters.semester;

    let query = `INSERT INTO userInfo VALUES(${facebookID}, '${firstName}', '${lastName}', '${eNumber}',
                  '${fieldOfStudy}', ${semester});`;

    console.log(query);

    client.query(query, function(err, result) {
      if (err){
        console.error(err);
        //res.send("Error " + err);
      }else{
        console.log(result.rows);
      }
    });
  }

  /*
  if(action == ACTION_WELCOME){

    facebookId = request.body.originalRequest.data.sender.id;

    client.query(`SELECT * FROM userInfo WHERE fbid=${facebookId}`, function(err, result) {
      if (err){
        console.error(err);
        response.send("Error " + err);
      }else{
        console.log(result.rows);
      }
    });

  }
  */

});

// set the port your listening
app.listen(PORT);
console.log('listening to port : ' + PORT);

// Get user information using the facebookId
function getFacebookData(facebookId, callback) {

  request({
    method: 'GET',
    url: 'https://graph.facebook.com/v2.8/' + facebookId,
    qs: {
      access_token: FB_PAGE_ACCESS_TOKEN
    }
  },

  function(err, response, body) {

    let userData = null
    if (err) console.log(err);
    else userData = JSON.parse(response.body);

    callback(err, userData);
  });
}

// function to check current details in userInfo
// here when user, requests <host>/users this function triggers.
app.get('/users', function (request, response) {

    console.log('===== db_query =====');

    var userList = [];

    client.query('SELECT * FROM userStudentFeels', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        //console.log(result.rows);
	  		for (var i = 0; i < result.rows.length; i++) {

		  		var user = {
		  			'eNumber':result.rows[i].enumber,
		  			'firstName':result.rows[i].firstname,
		  			'lastName':result.rows[i].lastname,
		  			'eMail':result.rows[i].email,
            'fieldOfStudy':result.rows[i].fieldofstudy,
            'semester':result.rows[i].semester
		  		}
		  		userList.push(user);
	  	}
	  	response.render('pages/userInfo', {"userList": userList});  // use the userInfo.pug file to show data
    }
  });
});



/*
function checkENumber(givenNumber, callback) {
  let num = givenNumber.replace('/', '').replace('e', '').replace('E', '').trim().toString();
  console.log(num);
  console.log(num.length);

  if(num.length != 5)var err = 'Invalid registration number';
  else {
    var data = 'E/' + num.substring(0,2) + '/' + num.substring(2,5);
    console.log(data);
  }
  callback(err, data);
}
*/


//some database manipulation functions

app.get('/db-create-tables-test', function (request, response) {

    console.log('===== db_query =====');

	//database instance
    client.query('SELECT * FROM table_current_semester_year1', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        console.log(result.rows);
      }
    });
});

app.get('/db-create-tables', function (request, response) {

    console.log('===== db_create tables =====');

	var sqlstatement=fs.readFileSync('db_related/schema/sql-create-tables.txt', 'utf8');//blocking read function

	//database instance
    client.query(
		sqlstatement,

		function(err, result) {
		  if (err){
			console.error(err); response.send("Error " + err);
		  }else{
			console.log("tables creation successfull");
		  }
		}
	);
});
