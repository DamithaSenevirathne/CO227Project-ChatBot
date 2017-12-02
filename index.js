
// https://vast-peak-63221.herokuapp.com/

var express = require('express') //a minimal and flexible Node.js web application framework that provides a robust set of features to develop web and mobile applications.
, bodyParser = require('body-parser'); //this is a node.js middleware for handling JSON, Raw, Text and URL encoded form data.

var http = require('http');
var request = require('request');

const path = require('path')

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

const ACTION_QUERY_BY_TIME = 'action_queryTimeTable_byTime';

//postgres database url
const DATABASE_URL = 'postgres://dcfvnzofeempgk:2c027d6f6788c5b82e4cbb9e9d388254211a61156d1fc1e35312c8c5885958aa@ec2-107-22-167-179.compute-1.amazonaws.com:5432/d3teg1g8u2anm';

// Map of Semesters to the DB Tables
const MAP_SEMESTER_TO_DB = [
  	"table_current_semester_year1",
 	  "table_current_semester_year2",
   	"table_current_semester_year3",
   	"table_current_semester_year4",
   	"table_current_semester_shortsem5",
   	"table_current_semester_shortsem6"
];

var app = express(); //getting an express instance , app?

const { Client } = require('pg');

//database connection information? database instance
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: true,
});

client.connect(); //connecting to the database? client database instance

app.use(bodyParser.json());
app.set('view engine', 'pug');    // set a view engine to show reults in web browser
app.get('/', (req, res) => res.render('pages/index'));

//incomming request, resulting response
app.post('/', function(request, res){

  let action = request.body.result.action; //getting the value of the action of incomming request
  console.log(action);

  if(action == ACTION_GETTING_STARTED){
    var facebookID = request.body.originalRequest.data.sender.id;//the facebook id
    console.log(facebookID);
	  //getFacebookData function was implemented in this js file.
    getFacebookData(facebookID, function(err, data){
      var firstName = data.first_name;  //first name, from the facebook account
      var firstMsg = `Hi ${firstName}`;
      res.send(JSON.stringify({'messages':
                      [{"type": 0, "speech": firstMsg},
                       {"type": 0, "speech": "I'm a Informational Chat bot for Pera Efac"},
                       {'title': 'To get started, tell me your role',
                        'replies': ['Lecturer', 'Instructor', 'Student'], 'type': 2}]}

      ))
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
  /*
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
  */
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
  // Need to query the DB using the time
  if(action == ACTION_QUERY_BY_TIME){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    let time = request.body.result.parameters.time;                     // time user asking

    queryByTime(time, facebookID, function (err, data) {
      if(!err){
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": data}]}))
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }

    });

  }

});

// set the port your listening
app.listen(PORT);
console.log('listening to port : ' + PORT);

//function to query the DB by time  e.g -> What do i have at 2pm ?
function queryByTime(time, facebookId, callback){

  console.log('======= Query By Time =========');

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          let table = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('Table to Query = ' + table);
          var date = 'monday';
          // get the day of the week to query the DB
          // getWeekDay(function (data) {
	        //    date = data;
          // });
//
          query = `Select courseid, starttime, endtime FROM ${table} WHERE timetabledate='${date}' AND starttime<='${time}' AND endtime>='${time}';`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error get courseId, startTime, endTime and send back to the user
              data = result;
              callback(error, data);

            }else {
              error = err || `No results found at ${table}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `No results found at table_user_student_feels`;
          callback(error, data);
        }
      });

    }else {
      error = err || `No results found at table_user_map_chatclients`;
      callback(error, data);
    }

  });

}

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

// function to get the day(Monday, Tuesday,.. of the week)
function getWeekDay(callback) {

  var weekday=new Array(7);
  weekday[0]="Monday";
  weekday[1]="Tuesday";
  weekday[2]="Wednesday";
  weekday[3]="Thursday";
  weekday[4]="Friday";
  weekday[5]="Saturday";
  weekday[6]="Sunday";

  var data = weekday[new Date().getDay()-1];

  callback(data);

}

// function to check current details in userInfo
// here when user, requests <host>/users this function triggers.
app.get('/users', function (request, response) {

    console.log('===== db_query =====');

    var userList = [];

    client.query('SELECT * FROM table_user_student_feels', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        //console.log(result.rows);
	  		for (var i = 0; i < result.rows.length; i++) {

		  		var user = {
		  			'eNumber':result.rows[i].registrationnumber,
		  			'firstName':result.rows[i].firstname,
		  			'lastName':result.rows[i].lastname,
		  			'eMail':result.rows[i]. primaryemail,
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

//view table content
app.get('/db-view-table', function (request, response) {

    console.log('===== db_view =====');
	var table_name= request.query.table_name;//$_GET["table_name"]
	var strsql='select * from '+table_name;
	//database instance
    client.query(strsql, function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        console.log(result.rows);
      }
    });
});

//db-populate?sql_file=table_current_semester_year1.txt
//database data population
app.get('/db-populate', function (request, response) {
    console.log('===== db_population =====');
	var sql_file= request.query.sql_file;//$_GET["sql_file"]
	var sqlstatement=fs.readFileSync('db_related/generation/'+sql_file, 'utf8');//blocking read function

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

//database schema generation
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
