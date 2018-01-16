
// https://vast-peak-63221.herokuapp.com/

const serverPath = 'http://localhost:8000/';

//postgres database url
const DATABASE_URL = 'postgres://dcfvnzofeempgk:2c027d6f6788c5b82e4cbb9e9d388254211a61156d1fc1e35312c8c5885958aa@ec2-107-22-167-179.compute-1.amazonaws.com:5432/d3teg1g8u2anm';

const { Client } = require('pg');

//database connection information? database instance
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: true,
});

client.connect(); //connecting to the database? client database instance

//-------------------------------------------------------------------------------------------------------[EMAIL HANDLING]---

var current_verification_code='0';
var current_facebook_id='';
var current_registrationnumber='';

var generator = require('generate-password');


var nodemailer = require('nodemailer'); //get instance


var transporter = nodemailer.createTransport({ //setting email account details
  service: 'gmail',
  auth: {
    user: 'perachatbot@gmail.com',
    pass: '39gkjgOJga#)(%@309y3kgb2589rDJLpew'
  }
});


function verification_code_generate(){
	var password = generator.generate({
		length: 10,
		numbers: true
	});
	current_verification_code=password;

	//update database
	db_query_update_verification_code(current_registrationnumber,'facebook',current_verification_code);

	return password;
}


function get_mail_send_verification(email_to,verification_code){
	var mail_send_verification = {
	  from: 'perachatbot@gmail@gmail.com',
	  to: email_to,
	  subject: 'PeraInfoBot - Facebook Verification!',
	  text: 'Please click this link to verify your request : '+serverPath+'/verify-facebook?regno='+current_registrationnumber+'&client=facebook&verification_code='+verification_code+'&client_id='+current_facebook_id
	};
	return mail_send_verification;
}

function email_send_verification_code(email_to){
	transporter.sendMail(get_mail_send_verification(email_to,verification_code_generate()), function(error, info){
	  if (error) {
		console.log(error);
	  } else {
		console.log('Email sent: ' + info.response);

	  }
	});
}

/**
	to send verification email
	email_send_verification_code('chandi2398@gmail.com');
**/

//-------------------------------------------------------------------------------------------------------[FB-REGISTRAION-FUNCTIONS]-------


function getCompatibleEnumber(given_enumber){
	return given_enumber.replace('E', 'e').replace(/\//g ,'').trim().toString();
}

function db_query_get_email_from_registrationnumber(user_table_name,confirmed_regnumber){

  console.log('======= db_query_get_email_from_registrationnumber =========');
  let query = `select primaryemail from ${user_table_name} where registrationnumber='${confirmed_regnumber}';`;
  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
      let primary_email = result.rows[0].primaryemail;
      console.log('primaryemail = ' + primary_email);
	  return primary_email;
    }else {
      error = err || `No record found at ${user_table_name}`;
      //callback(error, data);
	  return 'no-result-found';
    }
  });
}

//this function send a verification email to the given registration number on given table
function db_query_get_email_from_registrationnumber_and_send_verification_email(user_table_name,confirmed_regnumber){

  console.log('======= db_query_get_email_from_registrationnumber =========');
  let query = `select primaryemail from ${user_table_name} where registrationnumber='${confirmed_regnumber}';`;
  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
      let primary_email = result.rows[0].primaryemail;
      console.log('primaryemail = ' + primary_email);

	  //now send the email
	  email_send_verification_code(primary_email);

    }else {
      error = err || `No record found at ${user_table_name}`;
      //callback(error, data);
	  console.log('error : querying email using registration number');
    }
  });
}

//add the current facebooid to the database
function db_query_set_current_facebook_id(table_name,confirmed_regnumber,current_facebook_id){

  console.log('======= db_query_set_current_facebook_id =========');
  let query = `update ${user_table_name} set facebooid='${current_facebook_id}' where registrationnumber='${confirmed_regnumber}';`;
  var error, data;

  client.query(query, function(err, result) {
    if (!err){
      console.log('successfully linked the facebooid');

    }else {
      error = err || `No record found at ${user_table_name}`;
      //callback(error, data);
	  console.log('unsuccessfull - linking facebooid');
    }
  });
}


//update/insert the verification_code in database
//check for previous entries [regnumber+chatclient]
//if exists-> update else insert
function db_query_update_verification_code(confirmed_regnumber,chatting_client,verification_code){

  console.log('======= db_query_update_verification_code =========');

  let query = `select exists(select verificationcode from table_chatclient_verification where registrationnumber='${confirmed_regnumber}' and chatclient='${chatting_client}');`;
  var error, data;

  client.query(query, function(err, result) {
    if (!err){
	  let query_result = result.rows[0].exists;
      console.log("record exists : "+query_result);

	  if('true'==JSON.stringify(query_result)){//exists->update

		  let query = `update table_chatclient_verification set verificationcode='${verification_code}' where registrationnumber='${confirmed_regnumber}' and chatclient='${chatting_client}';`;
		  //console.log(query);
		  var error, data;

		  client.query(query, function(err, result) {
			if (!err){
			  console.log("verification code updated");
			}else {
			  error = err || `No record found at table`;
			  //callback(error, data);
			  console.log('unsuccessfull - db_query_update_verification_code-update error');
			}
		  });

	  }else{ //insert

			var request_time=new Date().toISOString().
								  replace(/T/, ' ').      // replace T with a space
								  replace(/\..+/, '');     // delete the dot and everything after;

		  let query = `insert into table_chatclient_verification(requestTime, registrationNumber, chatClient, verificationCode) values('${request_time}','${confirmed_regnumber}','${chatting_client}','${verification_code}');`;
		  var error, data;

		  client.query(query, function(err, result) {
			if (!err){
			  console.log("verification code inserted");
			}else {
			  error = err || `No record found at table`;
			  //callback(error, data);
			  console.log('unsuccessfull - db_query_update_verification_code-insert error');
			}
		  });
	  }

    }else {
      error = err || `No record found at ${user_table_name}`;
      //callback(error, data);
	  console.log('unsuccessfull - db_query_update_verification_code-existance_check');
    }
  });
}


//select verification code
function db_query_select_verification_code(confirmed_regnumber,chatting_client,verification_code,client_id,response){

  console.log('======= db_query_select_verification_code =========');
  let query = `(select verificationcode from table_chatclient_verification where registrationnumber='${confirmed_regnumber}' and chatclient='${chatting_client}');`;
  var error, data;

  client.query(query, function(err, result) {
    if (!err){


	  console.log(result.rows[0]);

	  let query_result = result.rows[0].verificationcode;
      console.log("verificationcode in db : "+query_result+ "sent : "+verification_code);

	  //verify the code
	  if(verification_code==query_result){
		  console.log('verification codes matched - linking started');
		  //landing page
		  response.render('pages/verify-facebook-valid');

		  //link the client

		  let query = `select exists(select * from table_user_map_chatclients where registrationnumber='${confirmed_regnumber}');`;
		  var error, data;

		  client.query(query, function(err, result) {
			if (!err){
			  let query_result = result.rows[0].exists;
			  console.log("record exists : "+query_result);

			  if('true'==JSON.stringify(query_result)){//exists->update

			  let query = `update table_user_map_chatclients set facebookid='${client_id}' where registrationnumber='${confirmed_regnumber}';`;
				  console.log(query);

				  var error, data;

				  client.query(query, function(err, result) {
					if (!err){
					  console.log("clinet link updated");
					}else {
					  error = err || `No record found at table`;
					  //callback(error, data);
					  console.log('unsuccessfull - db_query_select_verification_code-link update error');
					}
				  });

			  }else{ //insert

					var request_time=new Date().toISOString().
										  replace(/T/, ' ').      // replace T with a space
										  replace(/\..+/, '');     // delete the dot and everything after;

				  let query = `insert into table_user_map_chatClients(registrationnumber, facebookid, whatsappid, viberid, twitterid) values('${confirmed_regnumber}','${client_id}','NONE','NONE','NONE');`;
				  var error, data;

				  client.query(query, function(err, result) {
					if (!err){
					  console.log("facebooid  inserted");
					}else {
					  error = err || `No record found at table`;
					  //callback(error, data);
					  console.log('unsuccessfull - db_query_select_verification_code-insert error');
					}
				  });
			  }

			}else {
			  error = err || `No record found at ${user_table_name}`;
			  //callback(error, data);
			  console.log('unsuccessfull - db_query_select_verification_code-existance_check');
			}
		  });

	  }else{
		  console.log('verification codes not matched');
		  //landing page
		  response.render('pages/verify-facebook-invalid');
	  }

    }else {
      error = err || `No record found at table`;
      //callback(error, data);
	  console.log('unsuccessfull - db_query_select_verification_code-norecord');

	  response.render('pages/verify-facebook-invalid');
    }
  });


}


//-------------------------------------------------------------------------------[Nodejs App to support backend of DialogFlow]--------

var express = require('express') //a minimal and flexible Node.js web application framework that provides a robust set of features to develop web and mobile applications.
, bodyParser = require('body-parser'); //this is a node.js middleware for handling JSON, Raw, Text and URL encoded form data.

var http = require('http');
var request = require('request');

const path = require('path')

var fs = require('fs'); //to read files

// to format dates
var moment = require('moment');

//nodejs server online port
const PORT = process.env.PORT || 8000;

//Chatbot facebook page, access token
const FB_PAGE_ACCESS_TOKEN = 'EAAFLoV6ANvIBADadfOI0WWJ0ZBSd3cAO5Vm5GCpDYrjw4MPKu8OIh5tyv9hwHzoATCQGdM2z2xck4Mmg3kW4V8yzGQVvLCULnNC5nkGn9kLZBrQJZCPGPYZAWAFBlZB0FqBgEUYC7crwJfiQ5MuUEaViBZBzZCDq2TitfieKLuduAZDZD';

// Map of Semesters to the DB Tables
const MAP_SEMESTER_TO_DB = [
  	"table_current_semester_year1",
 	  "table_current_semester_year2",
   	"table_current_semester_year3",
   	"table_current_semester_year4",
   	"table_current_semester_shortsem5",
   	"table_current_semester_shortsem6"
];

// General Elective bucket limits
const CREDITS_BUCKET_ART = 2;
const CREDITS_BUCKET_MANAGEMENT = 5;
const CREDITS_BUCKET_SOCIAL = 2;

// Array to keep GE courses
var courseManagementBucket=[], courseArtBucket=[], courseSocialBucket=[], courseCommonBucket=[];


// Array to hold the week days
var weekday=new Array(7);
weekday[0]="Monday";
weekday[1]="Tuesday";
weekday[2]="Wednesday";
weekday[3]="Thursday";
weekday[4]="Friday";
weekday[5]="Saturday";
weekday[6]="Sunday";

// Time variables
var query_by_time_current_time, query_by_time_previous_starttime, query_by_time_previous_endtime, table_to_query, query_by_time_date;

// Date variables
var query_by_day_current_day, query_by_day_next_day, query_by_day_previous_day;

// Not Registered Error Message
var registerNow = {
      'data':{
        "facebook": [{
            "text": "Looks like you are not registered yet",
            "quick_replies":[
              {
                "content_type":"text",
                "title":"Register Now",
                "payload":"Get started"
              }
            ]
        }]
      }
    }

var app = express(); //getting an express instance , app?

app.use(bodyParser.json());
app.set('view engine', 'pug');    // set a view engine to show reults in web browser
app.get('/', (req, res) => res.render('pages/index'));

//incomming request, resulting response
app.post('/', function(request, res){

  let action = request.body.result.action; //getting the value of the action of incomming request
  console.log(action);

  /*
      =============================================================================
      Fisrt Instance user connect to the bot with Facbook Platform
      Ask for the role from the user
      =============================================================================
  */

  if(action == 'ACTION_FB_REG_GETTINGSTARTED'){
    var facebookID = request.body.originalRequest.data.sender.id;//the facebook id
    console.log(facebookID);

    // chech wether this is a registered user
    let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookID}';`;

    client.query(query, function(err, result) {
      if (!err && result.rows.length > 0){
        // registered User

        let firstMsg = ['Hi', 'Hey'];

        let randomIndex = Math.floor(Math.random() * firstMsg.length);
        let choosenMsg1 = firstMsg[randomIndex];

        let secondMsg = ['How can I help you?',
                         'What do you want to know?'];

        randomIndex = Math.floor(Math.random() * secondMsg.length);
        let choosenMsg2 = secondMsg[randomIndex];

        res.send(JSON.stringify({'messages':
                        [{"type": 0, "speech": choosenMsg1},
                         {"type": 0, "speech": choosenMsg2}]}
        ))

      }else {
        // Not registered, send introduction message
        //getFacebookData function was implemented in this js file.
        getFacebookData(facebookID, function(err, data){
          var firstName = data.first_name;  //first name, from the facebook account
          var firstMsg = `Hi ${firstName}`;

          res.send(JSON.stringify({'messages':
                          [{"type": 0, "speech": firstMsg},
                           {"type": 0, "speech": "I'm an Informational Chatbot for Pera Efac"},
                           {'title': 'To get started, tell me your role',
                            'replies': ['Lecturer', 'Instructor', 'Student'], 'type': 2}]}

          ))

        });

      }

    });

  }

  if(action == 'ACTION_FB_REG_ROLE_STUDENT_ENUMBER_CONFIRMED'){ //-----------------------------------------[FB_REG_SEND_VERIFICATION]-------
     var facebookID = request.body.originalRequest.data.sender.id;  //the facebook id
	   var confirmed_regnumber=request.body.result.parameters.eNumber;//get the confirmed enumber
	   current_facebook_id=facebookID; //update the current facebook id

	   console.log('confirmed enumber : '+getCompatibleEnumber(confirmed_regnumber));

	   current_registrationnumber=getCompatibleEnumber(confirmed_regnumber);

	   //sending the verification code
	   db_query_get_email_from_registrationnumber_and_send_verification_email('table_user_student_feels',current_registrationnumber);

    console.log('The facebook id: '+facebookID+' ; sent the confirmation email');
  }

  /*
      =============================================================================
      Actions used to Query Timetables using the time and date
      date, time variables are defined GLOBAL to all the time related Actions
      inorder to use in user asks (next and previous) followed by first query
      =============================================================================
  */

  // Need to query the DB using the time for the first time
  if(action == 'ACTION_QUERY_BY_TIME_1'){

    let facebookID = request.body.originalRequest.data.sender.id;           // facebook id
    query_by_time_current_time = request.body.result.parameters.time;       // time user asking
    // date user asking, if not use current date
    if(request.body.result.parameters.date){
      query_by_time_date = moment(request.body.result.parameters.date).format('dddd');
    }else {
      query_by_time_date = moment(new Date()).format('dddd');
    }

    queryByDateAndTime(query_by_time_date, query_by_time_current_time, facebookID, function (err, data) {

      if(!err){
        // Extract values from data and send to user + update our reference values  moment("12:15 AM", ["h:mm A"]).format("HH:mm");
        query_by_time_previous_endtime = data.endtime;
        query_by_time_previous_starttime = data.starttime;

        let starttime = moment(data.starttime, "HH:mm:ss").format('hh:mm A');
        let endtime = moment(data.endtime, "HH:mm:ss").format('hh:mm A');
        var reply = {'messages':
                        [{"type": 0, "speech": 'You have,'},
                         {"type": 0, "speech": `*${data.courseid}* from _${starttime}_ to _${endtime}_`}]}

        res.send(JSON.stringify(reply))
      }else{
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });

  }
  // Need to query the DB using the time for the second time (A next followed by 1st query)
  if(action == 'ACTION_QUERY_BY_TIME_NEXT'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    console.log(query_by_time_previous_endtime);
    queryByTimeNext(query_by_time_date, query_by_time_previous_endtime, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user + update our reference values

        query_by_time_previous_endtime = data.endtime;
        query_by_time_previous_starttime = data.starttime;

        let starttime = moment(data.starttime, "HH:mm:ss").format('hh:mm A');
        let endtime = moment(data.endtime, "HH:mm:ss").format('hh:mm A');
        var reply = {'messages':
                        [{"type": 0, "speech": 'You have,'},
                         {"type": 0, "speech": `*${data.courseid}* from _${starttime}_ to _${endtime}_`}]}

        res.send(JSON.stringify(reply))
      }else {
        if(err == `That's all for ${query_by_time_date}`){
          let nextDay;
          getNextDay(query_by_time_date, function (data) {
            nextDay = data;
          });

          res.send(JSON.stringify({'messages':
                          [{'title': err,
                            'replies': [`Show ${nextDay} Timetable`], 'type': 2}]}

          ))

        }else if (err == 'NOT_REGISTERED') {
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }
  // Need to query the DB using the time for the second time (A previous followed by 1st query)
  if(action == 'ACTION_QUERY_BY_TIME_PREVIOUS'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    console.log(query_by_time_previous_starttime);
    queryByTimePrevious(query_by_time_date, query_by_time_previous_starttime, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user + update our reference values

        query_by_time_previous_endtime = data.endtime;
        query_by_time_previous_starttime = data.starttime;

        let starttime = moment(data.starttime, "HH:mm:ss").format('hh:mm A');
        let endtime = moment(data.endtime, "HH:mm:ss").format('hh:mm A');
        var reply = {'messages':
                        [{"type": 0, "speech": 'You have,'},
                         {"type": 0, "speech": `*${data.courseid}* from _${starttime}_ to _${endtime}_`}]}

        res.send(JSON.stringify(reply))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }

  /*
      =============================================================================
      Actions used to Query Timetables using only the day
      Date variables are defined GLOBAL to all the time related Actions
      inorder to use in user asks (next and previous) followed by first query
      =============================================================================
  */

  // Need to query the DB using the day for the first time
  if(action == 'ACTION_QUERY_BY_DAY_1'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

    if(request.body.result.parameters.day){
      query_by_day_current_day = moment(request.body.result.parameters.day).format('dddd');
    }else {
      query_by_day_current_day = moment(new Date()).format('dddd');
    }

    console.log('Current day = ' + query_by_day_current_day);

    getPreviousDay(query_by_day_current_day, function (data) {
      query_by_day_previous_day = data;
    });
    getNextDay(query_by_day_current_day, function (data) {
      query_by_day_next_day = data;
    });

    queryByDay(query_by_day_current_day, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user + update our reference values
        res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }
  // Need to query the DB using the day for the second time
  if(action == 'ACTION_QUERY_BY_DAY_NEXT'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_day_current_day = query_by_day_next_day;      // day user asking

    getPreviousDay(query_by_day_current_day, function (data) {
      query_by_day_previous_day = data;
    });
    getNextDay(query_by_day_current_day, function (data) {
      query_by_day_next_day = data;
    });

    queryByDay(query_by_day_current_day, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user + update our reference values
        res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }
  // Need to query the DB using the day for the second time
  if(action == 'ACTION_QUERY_BY_DAY_PREVIOUS'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_day_current_day = query_by_day_previous_day;      // day user asking

    getPreviousDay(query_by_day_current_day, function (data) {
      query_by_day_previous_day = data;
    });
    getNextDay(query_by_day_current_day, function (data) {
      query_by_day_next_day = data;
    });

    queryByDay(query_by_day_current_day, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user + update our reference values
        res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }

  /*
     =============================================================================
     Actions used to query timetables using the courseID and date
     =============================================================================
 */

 // Need to query the DB using the courseID and date
 if(action == 'ACTION_QUERY_BY_COURSEID_AND_DATE'){

   let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

   if (request.body.result.parameters.CourseID) {

     query_by_courseID_specified_courseID = request.body.result.parameters.CourseID;      // courseID specified by user
     query_by_courseID_specified_day = moment(request.body.result.parameters.date).format('dddd');   // day specified by user

     queryByCourseID_Date(query_by_courseID_specified_courseID, query_by_courseID_specified_day,facebookID, function (err, data) {
       if(!err){
         // Extract values from data and send to user
         res.send(JSON.stringify(data))
       }else {
         if(err == 'NOT_REGISTERED'){
           res.send(JSON.stringify(registerNow))
         }else {
           res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
         }
       }
     });
   }else {
     let courseIdNotFound = ['I think you have made a mistake in the courseID',
                               'Check the courseID and try again',
                               `I don't have that course. Check it again`];

     let randomIndex = Math.floor(Math.random() * courseIdNotFound.length);
     let choosenMsg = courseIdNotFound[randomIndex];
     res.send(JSON.stringify({'messages': [{"type": 0, "speech": ':('},
                                           {"type": 0, "speech": choosenMsg}]}

     ))
   }

 }


 if(action == 'ACTION_QUERY_BY_COURSEID_AND_DATE_NEXT'){

    let facebookID = request.body.originalRequest.data.sender.id;           // facebook id
    let courseID = request.body.result.parameters.courseID;                 // courseID specified by user
    let day = moment(request.body.result.parameters.date).format('dddd');   // day specified by user
    let queryDay;

    getNextDay(day, function (data) {
      queryDay = data;
    });

    queryByCourseIDNextDay(courseID, queryDay, facebookID, function (err, data) {
      if(!err){
        // Extract values from data and send to user
        let msg = `You have *${courseID}* on ${data.timetabledate}`;
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": msg}]}))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }
    });

 }

  /*
    =============================================================================
      Actions used to query timetables using the courseID
    =============================================================================
  */

    // Need to query the DB using the courseID
    if(action == 'ACTION_QUERY_BY_COURSEID'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

    // check if the courseID is present in parameters
    if(request.body.result.parameters.CourseID){
      query_by_courseID_specified_courseID = request.body.result.parameters.CourseID;      // courseID specified by user
      queryByCourseID(query_by_courseID_specified_courseID,facebookID, function (err, data) {
        if(!err){
          console.log(data);
          // Extract values from data and send to user
          res.send(JSON.stringify(data))
        }else {
          if(err == 'NOT_REGISTERED'){
            res.send(JSON.stringify(registerNow))
          }else {
            res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
          }
        }

      });
    }else {

      let courseIdNotFound = ['I think you have made a mistake in the courseID',
                                'Check the courseID and try again',
                                `I don't have that course. Check it again`];

      let randomIndex = Math.floor(Math.random() * courseIdNotFound.length);
      let choosenMsg = courseIdNotFound[randomIndex];
      res.send(JSON.stringify({'messages': [{"type": 0, "speech": ':('},
                                            {"type": 0, "speech": choosenMsg}]}

      ))
    }


  }

  /*
      =============================================================================
      Actions used to Query the Timetables by next Lecture (What do i have next ?)
      =============================================================================
  */


  if(action == 'ACTION_QUERY_BY_NEXT_LECTURE'){

    let facebookID = request.body.originalRequest.data.sender.id;           // facebook id

    let date = moment(new Date()).format('dddd');
    let time = new moment().format("HH:mm");

    queryByNextLecture(date, time, facebookID, function (err, data) {
      if(!err){
        let starttime = moment(data.starttime, "HH:mm:ss").format('hh:mm A');
        let endtime = moment(data.endtime, "HH:mm:ss").format('hh:mm A');
        var reply = {'messages':
                        [{"type": 0, "speech": `At *${starttime}* on *${data.timetabledate}*`},
                         {"type": 0, "speech": `you have *${data.courseid}* until _${endtime}_`}]}

        res.send(JSON.stringify(reply))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });
  }

    /*
      =============================================================================
      Actions used to Query Timetables bu saying before or After
      What do i have before the lunch ?
      =============================================================================
  */

  if (action == 'ACTION_QUERY_BY_BEFORE') {

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

    var queryDay, queryTime;

    if(request.body.result.parameters.date){
      queryDay = moment(request.body.result.parameters.date).format('dddd');
    }else {
      queryDay = moment(new Date()).format('dddd');
    }

    if(request.body.result.parameters.time){
      queryTime = request.body.result.parameters.time;
    }else if (request.body.result.parameters.intervals) {
      queryTime = request.body.result.parameters.intervals;
    }else {

    }

    queryByBefore(facebookID, queryDay, queryTime, function (err, data) {

      if(!err){
          res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    })

  }

  if (action == 'ACTION_QUERY_BY_AFTER') {

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

    var queryDay, queryTime;

    if(request.body.result.parameters.date){
      queryDay = moment(request.body.result.parameters.date).format('dddd');
    }else {
      queryDay = moment(new Date()).format('dddd');
    }

    if(request.body.result.parameters.time){
      queryTime = request.body.result.parameters.time;
    }else if (request.body.result.parameters.intervals) {
      queryTime = request.body.result.parameters.intervals;
    }else {

    }

    queryByAfter(facebookID, queryDay, queryTime, function (err, data) {

      if(!err){
          res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    })

  }

  /*
      =============================================================================
      Actions used to Query the Full Timetables
      =============================================================================
  */

  if(action == 'ACTION_QUERY_FULL'){

    let facebookID = request.body.originalRequest.data.sender.id;           // facebook id

    queryFullTimeTable(facebookID, function (err, data) {
      if(!err){

        let path = serverPath + data;
        var data = {
              'data':{
                "facebook": [{
                    "attachment": {
                    "type": "template",
                    "payload": {
                      "template_type": "button",
                      "text":'Full Time Table',
                      "buttons": [{
                        "type":"web_url",
                        "url":`${path}`,
                        "title":"Show"
                      }]
                    }
                  }
                }]
              }
            }

            console.log(path);

        //var reply = {'messages': [{"type": 0, "speech": path}]}

        res.send(JSON.stringify(data))
      }else {
        if(err == 'NOT_REGISTERED'){
          res.send(JSON.stringify(registerNow))
        }else {
          res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }
      }

    });

  }


  /*
      =============================================================================
      Actions used to give course Info
      =============================================================================
  */

  if(action == 'ACTION_COURSE_INFO'){

    /*
      Check if the course is a valid
    */

    if(request.body.result.parameters.CourseID){

      let courseID = request.body.result.parameters.CourseID;           // course id

      generalCourseInfo(courseID, function (err, data) {
        if(!err){

          let path = serverPath + 'course-detail?courseid=' + courseID;
              var bucket = 'Categorized under,\n';

              if(data.courseart){
                bucket += 'Arts and Humanities\n';
              }
              if(data.coursemanagement){
                bucket += 'Management and Economics\n';
              }
              if(data.coursesocial){
                bucket += 'Political and Social Sciences\n';
              }

              var title = data.courseid + " - " + data.coursename
              var description = `Credits = ${data.coursecredits}\n${bucket}`

              var data = {
                    'data':{
                      "facebook": [{
                          "attachment": {
                          "type": "template",
                          "payload": {
                            "template_type": "generic",
                            "elements":[{
                              "title": title,
                              "subtitle": description,
                              "buttons":[{
                                "type":"web_url",
                                "url":`${path}`,
                                "title":"Read More"
                              }]
                              }
                            ]
                          }
                        }
                      }]
                    }
                  }

          //var reply = {'messages': [{"type": 0, "speech": path}]}

          res.send(JSON.stringify(data))

           //res.send(JSON.stringify({'messages': [{"type": 0, "speech": data}]}))
        }else {
           res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
        }

      });

    }else {
      let courseIdNotFound = ['I think you have made a mistake in the courseID',
                                'Check the courseID and try again',
                                `I don't have that course. Check it again`];

      let randomIndex = Math.floor(Math.random() * courseIdNotFound.length);
      let choosenMsg = courseIdNotFound[randomIndex];
      res.send(JSON.stringify({'messages': [{"type": 0, "speech": ':('},
                                            {"type": 0, "speech": choosenMsg}]}

      ))
    }

  }

  /*
      =============================================================================
      Actions used to give course by interests
      =============================================================================
  */

  if(action == 'ACTION_QUERY_COURSE_BY_TOPIC'){

    if(request.body.result.parameters.courseID){

      let courseID = request.body.result.parameters.courseID[0];           // course id

      console.log(courseID);

      generalCourseInfo(courseID, function (err, data) {
        if(!err){

          let path = serverPath + 'course-detail?courseid=' + courseID;
              var bucket = 'Categorized under,\n';

              if(data.courseart){
                bucket += 'Arts and Humanities\n';
              }
              if(data.coursemanagement){
                bucket += 'Management and Economics\n';
              }
              if(data.coursesocial){
                bucket += 'Political and Social Sciences\n';
              }

              var title = data.courseid + " - " + data.coursename
              var description = `Credits = ${data.coursecredits}\n${bucket}`

              var data = {
                    'data':{
                      "facebook": [{
                          "attachment": {
                          "type": "template",
                          "payload": {
                            "template_type": "generic",
                            "elements":[{
                              "title": title,
                              "subtitle": description,
                              "buttons":[{
                                "type":"web_url",
                                "url":`${path}`,
                                "title":"Read More"
                              }]
                              }
                            ]
                          }
                        }
                      }]
                    }
                  }

           res.send(JSON.stringify(data))
        }else {
           res.send(JSON.stringify({'messages': [{"type": 0, "speech": `:(`},
                                                 {"type": 0, "speech": `Sorry. I don't have a course that satisfies your need`}]}))
        }

      });

    }else {
      let courseIdNotFound = [`I couldn't find a course. Sorry!`,
                              `Sorry. I don't have a course that satisfies your need`];

      let randomIndex = Math.floor(Math.random() * courseIdNotFound.length);
      let choosenMsg = courseIdNotFound[randomIndex];
      res.send(JSON.stringify({'messages': [{"type": 0, "speech": ':('},
                                            {"type": 0, "speech": choosenMsg}]}

      ))
    }
  }

  /*
      =============================================================================
      Actions used to give the courses in a certain bucket
      =============================================================================
  */

  if (action == 'ACTION_COURSES_IN_A_BUCKET') {

      let bucket = request.body.result.parameters.bucket;           // the bucket user asking

      console.log('Bucket = ' + bucket);

      giveCoursesInBucket(bucket, function (err, data) {
        if(!err){

          let reply = {'messages' : []};

          for (var j = 0; j < data.length; j++) {

            let course = data[j];
            let msgCourse = {"type": 0, "speech": `*${course.courseid}* - ${course.coursename} _(${course.coursecredits})_`};
            reply.messages.push(msgCourse);

          }

          res.send(JSON.stringify(reply))

        }else {
          let reply = {'messages':
                          [{"type": 0, "speech": err}]}

          res.send(JSON.stringify(reply))
        }
      })

  }


  /*
      =============================================================================
      Actions used to give a combination of General Electives
      =============================================================================
  */

  if(action == 'ACTION_COMPLETE_ALL_IN_SEM5'){

      queryAllGEs(function (err, data) {

        if(!err){
          giveGECombination(function (err, data) {
            if(!err){

              var bucketArt=`*Arts and Humanities* (${CREDITS_BUCKET_ART})\n`,
                  bucketSocial=`*Political and Social Sciences* (${CREDITS_BUCKET_SOCIAL})\n`,
                  bucketManagement=`*Management and Economics* (${CREDITS_BUCKET_MANAGEMENT})\n`;

              for (var j = 0; j < data[0].length; j++) {
                var course = data[0][j];
                bucketArt += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
              }

              for (var j = 0; j < data[1].length; j++) {
                var course = data[1][j];
                bucketSocial += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
              }

              for (var j = 0; j < data[2].length; j++) {
                var course = data[2][j];
                bucketManagement += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
              }

              var reply = {'messages':
                              [{"type": 0, "speech": bucketArt},
                               {"type": 0, "speech": bucketSocial},
                                {"type": 0, "speech": bucketManagement}]}

              res.send(JSON.stringify(reply))

            }else {
              var reply = {'messages':
                              [{"type": 0, "speech": ':('},
                                {"type": 0, "speech": 'No combination is possible'}]}

              res.send(JSON.stringify(reply))
            }
          });
        }else {
          var reply = {'messages':
                          [{"type": 0, "speech": ':( Sorry'},
                            {"type": 0, "speech": 'Looks like there is a problem in the database, Try again later!'}]}

          res.send(JSON.stringify(reply))
        }
      });
  }

  if(action == 'ACTION_ANOTHER_COMBINATION'){
    giveGECombination(function (err, data) {
      if(!err){

        var bucketArt=`*Arts and Humanities* (${CREDITS_BUCKET_ART})\n`,
            bucketSocial=`*Political and Social Sciences* (${CREDITS_BUCKET_SOCIAL})\n`,
            bucketManagement=`*Management and Economics* (${CREDITS_BUCKET_MANAGEMENT})\n`;

        for (var j = 0; j < data[0].length; j++) {
          var course = data[0][j];
          bucketArt += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
        }

        for (var j = 0; j < data[1].length; j++) {
          var course = data[1][j];
          bucketSocial += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
        }

        for (var j = 0; j < data[2].length; j++) {
          var course = data[2][j];
          bucketManagement += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
        }

        var reply = {'messages':
                        [{"type": 0, "speech": bucketArt},
                         {"type": 0, "speech": bucketSocial},
                          {"type": 0, "speech": bucketManagement}]}

        res.send(JSON.stringify(reply))

      }else {
        var reply = {'messages':
                        [{"type": 0, "speech": ':('},
                          {"type": 0, "speech": 'No other combinations are possible'}]}

        res.send(JSON.stringify(reply))
      }
    });
  }

  /*
      =============================================================================
      Actions used to drop a General Elective
      =============================================================================
  */

  if(action == 'ACTION_DROP_GE'){

    var changeCourse = request.body.result.parameters.CourseID;

    var alternatives = '';

    for (var i = 0; i < changeCourse.length; i++) {

      alternatives += `You can replace *${changeCourse[i]}* with\n`

      checkDropCourseBucket(changeCourse[i], function (err, data) {
        if(!err){
          if(data[0] == 'art'){
            dropArtBucketCourse(changeCourse[i], data[1], function (err, data) {
              if(!err){
                for (var i = 0; i < data.length; i++) {
                  let course = data[i];
                  alternatives += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
                }
              }else {
                alternatives = err;
              }

            })

          }else if (data[0] == 'social') {
            // check for alternatives in Social Bucket
            dropSocialBucketCourse(changeCourse[i], data[1], function (err, data) {
              if(!err){
                for (var i = 0; i < data.length; i++) {
                  let course = data[i];
                  alternatives += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
                }
              }else {
                alternatives = err;
              }
            })
          }else {
            // check for alternatives in Management Bucket
            dropManagementBucketCourse(changeCourse[i], data[1], function (err, data) {
              if(!err){
                for (var i = 0; i < data.length; i++) {
                  let course = data[i];
                  alternatives += `_${course.courseid}_ - ${course.coursename} (${course.coursecredits})\n`
                }
              }else {
                alternatives = err;
              }
            })
          }
        }
      })
    }

    var reply = {'messages':
                    [{"type": 0, "speech": alternatives}]}

    res.send(JSON.stringify(reply))

  }

  /*
      =============================================================================
      Actions used to add a General Elective
      =============================================================================
  */

  if(action == 'ACTION_ADD_GE'){

    var addCourse = request.body.result.parameters.CourseID;

    var addArtCourseList = [], addSocialCourseList = [], addManagementCourseList = [];

    /*
        Check the Category of the courses user ask to add
    */

    for (var i = 0; i < addCourse.length; i++) {
      checkAddCourseBucket(addCourse[i], function (err, data) {
        if(!err){
          if(data[0] == 'art'){
            let course = [addCourse[i], data[1]];
            addArtCourseList.push(course);
            //console.log('Art Course');
          }else if (data[0] == 'social') {
            let course = [addCourse[i], data[1]];
            addSocialCourseList.push(course);
            //console.log('Social Course');
          }else if (data[0] == 'management'){
            let course = [addCourse[i], data[1]];
            addManagementCourseList.push(course);
            //console.log('Management Course');
          }else {
            console.log('Common Course');
          }
        }
      })
    }

    /*
        Check if the user ask to add Art Bucket courses
    */

    var reply = {'messages' : []};

    if(addArtCourseList.length > 0){
      addArtBucketCourse(addArtCourseList, function (err, data) {
        if(data == 'OK'){

          let msgHappy = {"type": 0, "speech": ":)"};
          let msgHappy2 = {"type": 0, "speech": `Great Choice! It will fulfil the required credits for the Arts and Humanities category`}

          reply.messages.push(msgHappy)
          reply.messages.push(msgHappy2)
          // var reply = {'messages':
          //                 [{"type": 0, "speech": ":)"},
          //                  {"type": 0, "speech": `Great Choice, you can have it under Art Category`}]}

          //res.send(JSON.stringify(reply))
        }else {
          // var reply = {'messages':
          //                 [{"type": 0, "speech": ":("},
          //                  {"type": 0, "speech": `${addCourse} alone wont cover the required credits`},
          //                  {"type": 0, "speech": "Select more courses"}]}

           let msgUnHappy = {"type": 0, "speech": ":("};
           let msgUnHappy2 = {"type": 0, "speech": `${addArtCourseList[0][0]} alone won't cover the required credits`}
           let msgUnHappy3 = {"type": 0, "speech": `Select more courses`}

           reply.messages.push(msgUnHappy)
           reply.messages.push(msgUnHappy2)
           reply.messages.push(msgUnHappy3)

          // res.send(JSON.stringify(reply))
        }
      })
    }

    /*
        Check if the user ask to add Social Bucket courses
    */

    if(addSocialCourseList.length > 0){
      addSocialBucketCourse(addSocialCourseList, function (err, data) {
        if(data == 'OK'){

          let msgHappy = {"type": 0, "speech": ":)"};
          let msgHappy2 = {"type": 0, "speech": `Great Choice! It will fulfil the required credits for the Political and Social Sciences category`}

          reply.messages.push(msgHappy)
          reply.messages.push(msgHappy2)

          //res.send(JSON.stringify(reply))
        }else {
          let msgUnHappy = {"type": 0, "speech": ":("};
          let msgUnHappy2 = {"type": 0, "speech": `${addSocialCourseList[0][0]} alone won't cover the required credits`}
          let msgUnHappy3 = {"type": 0, "speech": `Select more courses`}

          reply.messages.push(msgUnHappy)
          reply.messages.push(msgUnHappy2)
          reply.messages.push(msgUnHappy3)
        }
      })
    }

    /*
        Check if the user ask to add Management Bucket courses
    */

    if(addManagementCourseList.length > 0){
      addManagementBucketCourse(addManagementCourseList, function (err, data) {
        if(data == 'OK'){

          let msgHappy = {"type": 0, "speech": ":)"};
          let msgHappy2 = {"type": 0, "speech": `Great Choice! It will fulfil the required credits for the Management and Economics category`}

          reply.messages.push(msgHappy)
          reply.messages.push(msgHappy2)

        }else {
          let msgUnHappy = {"type": 0, "speech": ":("};
          let msgUnHappy2 = {"type": 0, "speech": `${addManagementCourseList[0][0]} alone won't cover the required credits`}
          let msgUnHappy3 = {"type": 0, "speech": `Select more courses`}

          reply.messages.push(msgUnHappy)
          reply.messages.push(msgUnHappy2)
          reply.messages.push(msgUnHappy3)
        }
      })
    }

    res.send(JSON.stringify(reply))

  }

  /*
      =============================================================================
      Actions used to query timetables using the courseType and semester
      =============================================================================
    */

  // Need to query the DB using the courseType and semester
  if(action == 'ACTION_QUERY_BY_COURSETYPE_AND_SEMESTER'){
    //var facebookID = request.body.originalRequest.data.sender.id;

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_courseType_and_semester_specified_courseType = request.body.result.parameters.CourseType;      // courseType specified by user
    query_by_courseType_and_semester_specified_semester = request.body.result.parameters.Semester;      // semester specified by user

    queryByCourseType_Semester(query_by_courseType_and_semester_specified_courseType, query_by_courseType_and_semester_specified_semester,facebookID, function (err, data) {
      if(!err){

        console.log(data);
        // Extract values from data and send to user
        res.send(JSON.stringify(data))
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }
    });
  }


 /*
      =============================================================================
      Actions used to query timetables using the courseType current semester
      =============================================================================
    */

  // Need to query the DB using the courseType and semester
  if(action == 'ACTION_QUERY_BY_COURSETYPE_IN_CURRENT_SEMESTER'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_courseType_and_semester_specified_courseType = request.body.result.parameters.CourseType;      // courseType specified by user

    queryByCourseType_CurrentSemester(query_by_courseType_and_semester_specified_courseType,facebookID, function (err, data) {
      if(!err){

        console.log(data);
        // Extract values from data and send to user
        res.send(JSON.stringify(data))
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }
    });
  }

     /*
      =============================================================================
      Actions used to query timetables using the semester (All courses)
      =============================================================================
    */

  // Need to query the DB using the semester
  if(action == 'ACTION_QUERY_BY_SEMESTER_ALL_COURSES'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_courseType_and_semester_specified_semester = request.body.result.parameters.Semester;      // semester specified by user


    queryBySemester(query_by_courseType_and_semester_specified_semester,facebookID, function (err, data) {
      if(!err){

        console.log(data);
        // Extract values from data and send to user
        res.send(JSON.stringify(data))
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }
    });
  }

    /*
      =============================================================================
      Actions used to query timetables using the current semester (All courses)
      =============================================================================
    */

  // Need to query the DB using the current semester
  if(action == 'ACTION_QUERY_BY_CURRENT_SEMESTER_ALL_COURSES'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id

    queryByCurrentSemester(facebookID, function (err, data) {
      if(!err){

        console.log(data);
        // Extract values from data and send to user
        res.send(JSON.stringify(data))
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }
    });
  }

});

// set the port your listening
app.listen(PORT);
console.log('listening to port : ' + PORT);

/*
  ==============================================================================
  Functions used to query the DB by CourseID and date
  ==============================================================================
*/

//function to query the DB by courseID and date e.g. -> When do I have CO227 tomorrow?
function queryByCourseID_Date(CourseID, day, facebookId, callback){

  console.log('======= Query By CourseID and Date =========');

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `SELECT fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);
          //query_by_time_date = 'Monday';

          query = `SELECT * FROM ${table_to_query} WHERE courseid='${CourseID}' AND timetabledate='${day}' ORDER BY starttime;`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no error get required time and send back to the user
              var firstMsg = {type : 0, speech : `On *${day}* you have *${CourseID}* from`}
              data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {

                let courseID = result.rows[i].courseid;
                let startTime = moment(result.rows[i].starttime, "HH:mm:ss").format('hh:mm A');
                let endTime = moment(result.rows[i].endtime, "HH:mm:ss").format('hh:mm A');

                let msg = `_${startTime}_ - _${endTime}_\n`;
                var course = {type : 0, speech : msg};

                data[key].push(course);
              }
               callback(error, data);


            }else {
              error = err || `You don't have ${CourseID} on ${day}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

/*
  ==============================================================================
  Functions used to query the DB by CourseID
  ==============================================================================
*/

//function to query the DB by courseID and days e.g. -> When do I have CO227 next week?
function queryByCourseID(CourseID, facebookId, callback){

  console.log('======= Query By CourseID =========');

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into



  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `SELECT fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);
          //query_by_time_date = 'Monday';

          query = `SELECT * FROM ${table_to_query} WHERE courseid='${CourseID}';`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no error get required time and send back to the user
              var firstMsg = {type : 0, speech : `You have ${CourseID} `}
              data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {

                let courseID = result.rows[i].courseid;
                let startTime = moment(result.rows[i].starttime, "HH:mm:ss").format('hh:mm A');
                let endTime = moment(result.rows[i].endtime, "HH:mm:ss").format('hh:mm A');
                let timetabledate = result.rows[i].timetabledate;

                let msg = `*${timetabledate}*\n_${startTime}_ - _${endTime}_`;
                var course = {type : 0, speech : msg};

                data[key].push(course);
              }
               callback(error, data);


            }else {
              //error = err || `You don't have ${CourseID} on ${day}`;
              error = err || `I don't have ${CourseID}. Seems like you have made a mistake`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

function queryByCourseIDNextDay(courseID, queryDay, facebookId, callback) {

  console.log('======= Query By cousreID + Next Day ========= ' + courseID + " " + queryDay);

  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          query = `Select * FROM ${table_to_query} WHERE courseid='${courseID}' AND timetabledate>='${queryDay}' ORDER BY timetabledate;`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error give the data to the user
              console.log(result.rows);
              data = result.rows[0];
              callback(error, data);

            }else {
              error = err || `Looks like the course is missing`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

/*
  ==============================================================================

  Functions used to query the DB by Next Lecture (When is the next Lecture)

  ==============================================================================
*/

function queryByNextLecture(date, time, facebookId, callback){

  console.log('======= Query By Next Lecture =========');

  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error, data, query_date = date, query_time = time;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          query = `Select * FROM ${table_to_query} WHERE timetabledate='${query_date}' AND starttime>='${query_time}' ORDER BY starttime;`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error give the data to the user
              console.log(result.rows);
              data = result.rows[0];
              callback(error, data);

            }else {
              // Go to next day and query
              getNextDay(query_date, function (data) {
                query_date = data;
              });
              query_time = '00:00:00';

              query = `Select * FROM ${table_to_query} WHERE timetabledate='${query_date}' AND starttime>='${query_time}' ORDER BY starttime;`;
              console.log('date & time changed... ' + query_date + " " + query_time);
              client.query(query, function(err, result) {

                if (!err && result.rows.length > 0){
                  // If no Error give the data to the user
                  data = result.rows[0];
                  callback(error, data);

                }else {
                  // Go to next day and query
                  getNextDay(query_date, function (data) {
                    query_date = data;
                  });
                  query_time = '00:00:00';
                }
              });
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

/*
  ==============================================================================

  Functions used to query the DB by Time and Date

  ==============================================================================
*/

//function to query the DB by time  e.g -> What do i have at 2pm ?
function queryByDateAndTime(date, time, facebookId, callback){

  console.log('======= Query By Time And Date =========');
  console.log('time = ' + time + " date = " + date);

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          query = `Select * FROM ${table_to_query} WHERE timetabledate='${date}' AND starttime<='${time}' AND endtime>='${time}';`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error get courseId, startTime, endTime and send back to the user
              console.log(result.rows);
              data = result.rows[0];
              callback(error, data);

            }else {
              let timeAsked = moment(time, "HH:mm:ss").format('hh:mm A');
              error = err || `You don't have anything at ${timeAsked} on ${date}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

//function to query the DB by time(user say next followed by 1st query)  e.g -> What do i have at 2pm ? Next ?
function queryByTimeNext(date, time, facebookId, callback){

  console.log('======= Query By Time Next =========');

  var error, data;

  query = `Select * FROM ${table_to_query} WHERE timetabledate='${date}' AND starttime>='${time}' order by starttime;`;

  client.query(query, function(err, result) {

    if (!err && result.rows.length > 0){
      // If no Error get courseId, startTime, endTime and send back to the user
      console.log(result.rows);
      data = result.rows[0];
      callback(error, data);

    }else {
      error = err || `That's all for ${query_by_time_date}`;
      callback(error, data);
    }
  });

}

//function to query the DB by time(user say previous followed by 1st query)  e.g -> What do i have at 2pm ? Before it ?
function queryByTimePrevious(date, time, facebookId, callback){

console.log('======= Query By Time Before =========');

var error, data;

query = `Select * FROM ${table_to_query} WHERE timetabledate='${date}' AND endtime<='${time}' order by endtime DESC;`;

client.query(query, function(err, result) {

  if (!err && result.rows.length > 0){
    // If no Error get courseId, startTime, endTime and send back to the user
    console.log(result.rows);
    data = result.rows[0];
    callback(error, data);

  }else {
    error = err || `You have nothing before that on ${query_by_time_date}`;
    callback(error, data);
  }
});

}

//function to query the DB by before  e.g -> What do i have before 2pm ?
function queryByBefore(facebookId, date, time, callback){

  console.log('======= Query By Before =========');
  console.log('time = ' + time + " date = " + date);

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;

  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          query = `Select * FROM ${table_to_query} WHERE timetabledate='${date}' AND endtime<='${time}' ORDER BY starttime;`;

          client.query(query, function(err, result) {

            if(!err && result.rows.length > 0){

            var firstMsg = {type : 0, speech : `You have,`}
            data[key].push(firstMsg)

            for (var i = 0; i < result.rows.length; i++) {

              let cousreID = result.rows[i].courseid;
              // format the time into Am, Pm format
              let startTime = moment(result.rows[i].starttime, "HH:mm:ss").format('hh:mm A');
              let endTime = moment(result.rows[i].endtime, "HH:mm:ss").format('hh:mm A');

              let msg = `*${cousreID}*\n_${startTime}_ - _${endTime}_`;
              var course = {type : 0, speech : msg};

              data[key].push(course);
            }

            callback(error, data);

            }else {
              let timeAsked = moment(time, "HH:mm:ss").format('hh:mm A');
              error = err || `You don't have anything before ${timeAsked} on ${date}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

//function to query the DB by before  e.g -> What do i have after 2pm ?
function queryByAfter(facebookId, date, time, callback){

  console.log('======= Query By After =========');
  console.log('time = ' + time + " date = " + date);

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;

  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          query = `Select * FROM ${table_to_query} WHERE timetabledate='${date}' AND starttime>='${time}' ORDER BY starttime;`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error get courseId, startTime, endTime and send back to the user
              var firstMsg = {type : 0, speech : `You have,`}
              data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {

                let cousreID = result.rows[i].courseid;
                // format the time into Am, Pm format
                let startTime = moment(result.rows[i].starttime, "HH:mm:ss").format('hh:mm A');
                let endTime = moment(result.rows[i].endtime, "HH:mm:ss").format('hh:mm A');

                let msg = `*${cousreID}*\n_${startTime}_ - _${endTime}_`;
                var course = {type : 0, speech : msg};

                data[key].push(course);
              }

              callback(error, data);

            }else {
              let timeAsked = moment(time, "HH:mm:ss").format('hh:mm A');
              error = err || `You don't have anything after ${timeAsked} on ${date}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}


/*
  ==============================================================================

  Functions used to query the DB by Day

  ==============================================================================
*/


//function to query the DB by time  e.g -> What do i have at 2pm ?
function queryByDay(day, facebookId, callback){

  console.log(`======= Query By Day on ${day}=========`);

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;

  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);
          query = `Select * FROM ${table_to_query} WHERE timetabledate='${day}' ORDER BY starttime;`;

          client.query(query, function(err, result) {

            if (!err && result.rows.length > 0){
              // If no Error get courseId, startTime, endTime and send back to the user

              var firstMsg = {type : 0, speech : `On ${day} you have,`}
              data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {

                let cousreID = result.rows[i].courseid;
                // format the time into Am, Pm format
                let startTime = moment(result.rows[i].starttime, "HH:mm:ss").format('hh:mm A');
                let endTime = moment(result.rows[i].endtime, "HH:mm:ss").format('hh:mm A');

                let msg = `*${cousreID}*\n_${startTime}_ - _${endTime}_`;
                var course = {type : 0, speech : msg};

                data[key].push(course);
              }

              callback(error, data);

            }else {
              error = err || `You don't have anything on ${day}`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

/*
  ==============================================================================

  Functions used to query the DB to get Full Timetable

  ==============================================================================
*/

//function to query the DB by to get full time table  e.g -> show me my timetable
function queryFullTimeTable(facebookId, callback){

  console.log('======= Query Full Time table =========');

  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error, data;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `Select fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;
          table_to_query = MAP_SEMESTER_TO_DB[semester-1];   // Since indexing is done from 0
          console.log('table to Query = ' + table_to_query);

          let data = `timetable?timetable=${table_to_query}&field=${fieldOfStudy}`;

          callback(error, data);

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || 'NOT_REGISTERED';
      callback(error, data);
    }

  });
}

/*
  ==============================================================================

  Functions used to query the DB by CourseType and Semester

  ==============================================================================
*/

//function to query the DB by CourseType and Semester e.g. -> Which general electives do I have in semester 4?
function queryByCourseType_Semester(CourseType, Semester, facebookId, callback){


  console.log('======= Query By CourseType and Semester =========');

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  if(CourseType == 'general'){
    console.log('table to Query = table_course_general');
    query = `SELECT * FROM table_course_general WHERE courseSem ='${Semester}';`;
  }
  else {
    console.log('table to Query = table_course');
    query = `SELECT * FROM table_course WHERE coursetype='${CourseType}' AND coursesem ='${Semester}';`;
  }

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      if(CourseType == 'core'){
        if(Semester == 'short'){
          var firstMsg = {type : 0, speech : `In the short semester you have the following ${CourseType} courses,`}
        } else {
          var firstMsg = {type : 0, speech : `In Semester ${Semester} you have the following ${CourseType} courses,`}
        }

      } else {
        if(Semester == 'short'){
          var firstMsg = {type : 0, speech : `In the short semester you have the following ${CourseType} electives,`}
        } else {
          var firstMsg = {type : 0, speech : `In Semester ${Semester} you have the following ${CourseType} electives,`}
        }
      }
      data[key].push(firstMsg)

      for (var i = 0; i < result.rows.length; i++) {
        let courseID = result.rows[i].courseid;
        let courseName = result.rows[i].coursename;

        let msg = `*${courseID}:* _${courseName}_\n`;
        var course = {type : 0, speech : msg};
        data[key].push(course);
      }
      callback(error, data);


    } else {
      if(CourseType == 'core'){
        error = err || `You're not offered any ${CourseType} courses in that semester.`;
        callback(error, data);
      } else{
        error = err || `You're not offered any ${CourseType} electives in that semester.`;
        callback(error, data);
      }
    }
  });
}

/*
  ==============================================================================

  Functions used to query the DB by CourseType in Current Semester

  ==============================================================================
*/

//function to query the DB by CourseType in Current Semester e.g. -> What are the general electives offered in current semester
function queryByCourseType_CurrentSemester(CourseType, facebookId, callback){

  console.log('======= Query By CourseType in Current Semester =========');

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `SELECT fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;

          if(CourseType == 'general'){
            console.log('table to Query = table_course_general');
            query = `SELECT * FROM table_course_general WHERE courseSem ='${semester}';`;
          }
          else {
            console.log('table to Query = table_course');
            query = `SELECT * FROM table_course WHERE coursetype='${CourseType}' AND coursesem ='${semester}';`;
          }

          client.query(query, function(err, result) {

          if (!err && result.rows.length > 0){
          // If no error get required time and send back to the user
            if(CourseType == 'core'){
              if(semester == 'short'){
                var firstMsg = {type : 0, speech : `In the short semester you have the following ${CourseType} courses,`}
              } else {
                var firstMsg = {type : 0, speech : `In Semester ${semester} you have the following ${CourseType} courses,`}
              }

            } else {
              if(semester == 'short'){
                var firstMsg = {type : 0, speech : `In the short semester you have the following ${CourseType} electives,`}
              } else {
                var firstMsg = {type : 0, speech : `In Semester ${semester} you have the following ${CourseType} electives,`}
              }
            }
            data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {

                let courseID = result.rows[i].courseid;
                let courseName = result.rows[i].coursename;

                let msg = `*${courseID}:* _${courseName}_\n`;
                var course = {type : 0, speech : msg};
                data[key].push(course);
              }
               callback(error, data);


            }else {
              if(CourseType == 'core'){
                error = err || `You're not offered any ${CourseType} courses in the current semester.`;
                callback(error, data);
              } else{
                error = err || `You're not offered any ${CourseType} electives in the current semester.`;
                callback(error, data);
              }
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || `Looks like you are not registered yet`;
      callback(error, data);
    }

  });
}


/*
  ==============================================================================

  Functions used to query the DB by Semester (All Courses)

  ==============================================================================
*/

//function to query the DB by Semester e.g. -> What are the courses offered in semester 4
function queryBySemester(Semester, facebookId, callback){

  console.log('======= Query By Semester (All Courses) =========');

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  console.log('table to Query = table_course_general and table_course ');

  query = `SELECT * FROM table_course WHERE coursesem ='${Semester}';`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      if(Semester == 'short'){
        var firstMsg = {type : 0, speech : `In the short semester you have the following courses,`}
      } else {
        var firstMsg = {type : 0, speech : `In Semester ${Semester} you have the following courses,`}
      }

      data[key].push(firstMsg)

      for (var i = 0; i < result.rows.length; i++) {
        let courseID = result.rows[i].courseid;
        let courseName = result.rows[i].coursename;
        let courseType = result.rows[i].coursetype;

        let msg = `*${courseID}:* _${courseName} (${courseType})_\n`;
        var course = {type : 0, speech : msg};
        data[key].push(course);
      }

      if(Semester == 'short' | Semester == '8' ){
        query = `SELECT * FROM table_course_general WHERE coursesem ='${Semester}';`;

        client.query(query, function(err, result) {
          if (!err && result.rows.length > 0){
            for (var i = 0; i < result.rows.length; i++) {
              let courseID = result.rows[i].courseid;
              let courseName = result.rows[i].coursename;

              let msg = `*${courseID}:* _${courseName} (general)_\n`;
              var course = {type : 0, speech : msg};
              data[key].push(course);
            }
            callback(error, data);

          } else {
            callback(error, data);
          }
      });

      }else{
        callback(error, data);
      }

    } else {
      error = err || `That is not a valid semester! Try again.`;
      callback(error, data);
    }
  });
}


/*
  ==============================================================================

  Functions used to query the DB by Current Semester (All Courses)

  ==============================================================================
*/

//function to query the DB by Current Semester e.g. -> What are the courses offered in current semester
function queryByCurrentSemester(facebookId, callback){

  console.log('======= Query By Current Semester (All Courses) =========');

  //console.log(facebookID);
  // get eNumber with facebookID
  let query = `Select registrationnumber FROM table_user_map_chatclients WHERE facebookid='${facebookId}';`;

  var error;
  var data = {}          // empty Object
  var key = 'messages';
  data[key] = [];       // empty Array, which you can push() values into

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfotable
      let eNumber = result.rows[0].registrationnumber;
      console.log('eNumber = ' + eNumber);
      query = `SELECT fieldofstudy, semester FROM table_user_student_feels WHERE registrationnumber='${eNumber}';`;

      client.query(query, function(err, result) {
        if (!err && result.rows.length > 0){
          // If no Error get fieldOfStudy, Semester and query the respective table
          let fieldOfStudy = result.rows[0].fieldofstudy;
          let semester = result.rows[0].semester;

          query = `SELECT * FROM table_course WHERE coursesem ='${semester}';`;

          client.query(query, function(err, result) {
            if (!err && result.rows.length > 0){
              if(semester == 'short'){
                var firstMsg = {type : 0, speech : `In the short semester you have the following courses,`}
              } else {
                var firstMsg = {type : 0, speech : `In Semester ${semester} you have the following courses,`}
              }

              data[key].push(firstMsg)

              for (var i = 0; i < result.rows.length; i++) {
                let courseID = result.rows[i].courseid;
                let courseName = result.rows[i].coursename;
                let courseType = result.rows[i].coursetype;

                let msg = `*${courseID}:* _${courseName} (${courseType})_\n`;
                var course = {type : 0, speech : msg};
                data[key].push(course);
              }

              if(semester == 'short' | semester == '8' ){
                query = `SELECT * FROM table_course_general WHERE coursesem ='${semester}';`;

                client.query(query, function(err, result) {
                  if (!err && result.rows.length > 0){
                    for (var i = 0; i < result.rows.length; i++) {
                      let courseID = result.rows[i].courseid;
                      let courseName = result.rows[i].coursename;

                      let msg = `*${courseID}:* _${courseName} (general)_\n`;
                      var course = {type : 0, speech : msg};
                      data[key].push(course);
                    }
                    callback(error, data);

                  } else {
                    callback(error, data);
                  }
              });

              }else{
                callback(error, data);
              }

            } else {
              error = err || `That is not a valid semester! Try again.`;
              callback(error, data);
            }
          });

        }else {
          error = err || `Seems like you're not an Efac student`;
          callback(error, data);
        }
      });

    }else {
      error = err || `Looks like you are not registered yet`;
      callback(error, data);
    }

  });
}

/*
  ==============================================================================

  Functions used to give General Elective Course Information

  ==============================================================================
*/

function generalCourseInfo(courseId, callback){

console.log('======= Course Info = ' + courseId);

  var error, data;

  query = `Select * FROM table_course_general WHERE courseid='${courseId}';`;

  client.query(query, function(err, result) {

    if (!err && result.rows.length > 0){
      // If no Error get info and send back to the user
      data = result.rows[0];
      callback(error, data);

    }else {
      error = err || `I don't have that course :(, check whether you have made a mistake`;
      callback(error, data);
    }
  });

}

/*
  ==============================================================================

  Functions used to give courses in a bucket

  ==============================================================================
*/

function giveCoursesInBucket(bucket, callback) {

    var error, data;
    console.log("======= Query Courses in Bucket = " + bucket);

    let query = `Select courseid, coursename, coursecredits FROM table_course_general WHERE ${bucket[0]}='t' `;

    if(bucket.length > 1){
      for (var i = 1; i < bucket.length; i++) {
        query += `AND ${bucket[i]}='t' `;
      }
    }else {
      query += `;`
    }

    client.query(query, function(err, result) {

      if (!err && result.rows.length > 0){
        // If no Error get info and send back to the user
        data = result.rows;
        callback(error, data);

      }else {
        error = err || `I don't have any courses in that category :(`;
        callback(error, data);
      }
    });

}

/*
  ==============================================================================

  Functions used to give a combination of General Electives

  ==============================================================================
*/

/* Query the DB and add to the courses to an array */

function queryAllGEs(callback) {

  var error, data;

  courseCommonBucket = []; courseManagementBucket=[]; courseArtBucket=[]; courseSocialBucket=[];

  console.log("======= Query Electives ======");

  var queryAllBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='t' AND courseart='t' AND coursesocial='t';`;

  client.query(queryAllBucket, function(err, result) {

    if (!err){
      // If no Error get the data and add to bucket
      for (var i = 0; i < result.rows.length; i++) {
        var course = result.rows[i];
        course['selected'] = 'N';
        course['art'] = 't';
        course['social'] = 't';
        course['management'] = 't';
        courseCommonBucket.push(course);
      }

      var queryArtANDSocialBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='f' AND courseart='t' AND coursesocial='t';`;

      client.query(queryArtANDSocialBucket, function(err, result) {

        if (!err){
          // If no Error get the data and add to bucket
          for (var i = 0; i < result.rows.length; i++) {
            var course = result.rows[i];
            course['selected'] = 'N';
            course['art'] = 't';
            course['social'] = 't';
            course['management'] = 'f';
            courseCommonBucket.push(course);
          }

          var queryArtANDManagementBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='t' AND courseart='t' AND coursesocial='f';`;

          client.query(queryArtANDManagementBucket, function(err, result) {

            if (!err){
              // If no Error get the data and add to bucket
              for (var i = 0; i < result.rows.length; i++) {
                var course = result.rows[i];
                course['selected'] = 'N';
                course['art'] = 't';
                course['social'] = 'f';
                course['management'] = 't';
                courseCommonBucket.push(course);
              }

              var querySocialANDManagementBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='t' AND courseart='f' AND coursesocial='t';`;

              client.query(querySocialANDManagementBucket, function(err, result) {

                if (!err){

                  // If no Error get the data and add to bucket
                  for (var i = 0; i < result.rows.length; i++) {
                    var course = result.rows[i];
                    course['selected'] = 'N';
                    course['art'] = 'f';
                    course['social'] = 't';
                    course['management'] = 't';
                    courseCommonBucket.push(course);
                  }

                  var queryManagementBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='t' AND courseart='f' AND coursesocial='f';`;

                  client.query(queryManagementBucket, function(err, result) {

                    if (!err){

                      // If no Error get the data and add to bucket
                      for (var i = 0; i < result.rows.length; i++) {
                        var course = result.rows[i];
                        course['selected'] = 'N';
                        courseManagementBucket.push(course);
                      }

                      var queryArtBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='f' AND courseart='t' AND coursesocial='f';`;

                      client.query(queryArtBucket, function(err, result) {

                        if (!err){
                          // If no Error get the data and add to bucket
                          for (var i = 0; i < result.rows.length; i++) {
                            var course = result.rows[i];
                            course['selected'] = 'N';
                            courseArtBucket.push(course);
                          }

                          var querySocialBucket = `Select courseid, coursename, coursecredits FROM table_course_general WHERE coursesem='short' AND coursemanagement='f' AND courseart='f' AND coursesocial='t';`;

                          client.query(querySocialBucket, function(err, result) {

                            if (!err){

                              // If no Error get the data and add to bucket
                              for (var i = 0; i < result.rows.length; i++) {
                                var course = result.rows[i];
                                course['selected'] = 'N';
                                courseSocialBucket.push(course);
                              }
                              callback(error, data);

                            }else {
                              error = err || 'Social Bucket query failed !';
                              callback(error, data);
                            }
                          });

                        }else {
                          error = err || 'Art Bucket query failed !';
                          callback(error, data);
                        }
                      });

                    }else {
                      error = err || 'Management Bucket query failed !';
                      callback(error, data);
                    }
                  });

                }else {
                  error = err || 'Common(Social_Mang) Bucket query failed !';
                  callback(error, data);
                }
              });

            }else {
              error = err || 'Common(Art_Mang) Bucket query failed !';
              callback(error, data);
            }
          });

        }else {
          error = err || 'Common(Art_Social) Bucket query failed !';
          callback(error, data);
        }
      });

    }else {
      error = err || 'Common(3) Bucket query failed !';
      callback(error, data);
    }
  });

}

//HowIneedToCompleteTheElectives
/* Give a combination from the array of courses */

var selectedArtBucket=[], selectedSocialBucket=[], selectedManagementBucket=[];
var previousSelectedArtBucket=[], previousSelectedSocialBucket=[], previousSelectedManagementBucket=[];

function giveGECombination(callback) {

  console.log("Combination started !");

  var data=[], err;
  selectedArtBucket=[]; selectedSocialBucket=[]; selectedManagementBucket=[];
  var creditArt = 0, creditManagement = 0, creditSocial = 0, count = 0;

  /* ----------  Fill the Art Bucket  ---------- */

  while (creditArt < CREDITS_BUCKET_ART && count < courseArtBucket.length) {
    let course = courseArtBucket[count];
    if(course.selected == 'N'){

      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      selectedArtBucket.push(selectedCourse);
      courseArtBucket[count].selected = 'Y';
      creditArt += course.coursecredits;

    }else {
      courseArtBucket[count].selected = 'N';
    }
    count++;
  }

  /* ----------  Fill the Social Bucket  ---------- */
  count = 0;
  while (creditSocial < CREDITS_BUCKET_SOCIAL && count < courseSocialBucket.length) {
    let course = courseSocialBucket[count];
    if(course.selected == 'N'){
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      selectedSocialBucket.push(selectedCourse);
      courseSocialBucket[count].selected = 'Y';
      creditSocial += course.coursecredits;

    }else {
      courseSocialBucket[count].selected = 'N';
    }
    count++;
  }

  /* ----------  Fill the Management Bucket  ---------- */
  count = 0;
  while (creditManagement < CREDITS_BUCKET_MANAGEMENT && count < courseManagementBucket.length) {
    let course = courseManagementBucket[count];
    if(course.selected == 'N'){
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      selectedManagementBucket.push(selectedCourse);
      courseManagementBucket[count].selected = 'Y';
      creditManagement += course.coursecredits;

    }else {
      courseManagementBucket[count].selected = 'N';
    }
    count++;
  }


  /* Check if any bucket is not filled
      - Use the Common bucket to fill up those
  */

  if(creditArt < CREDITS_BUCKET_ART){
    /*if(creditSocial >= CREDITS_BUCKET_SOCIAL){
      count = 0;
      while (creditArt < CREDITS_BUCKET_ART && count < courseCommonBucket.length) {
        if(courseCommonBucket[count].selected = 'N' && courseCommonBucket[count].art = 't' && courseCommonBucket[count].social = 't'){
          let course = courseCommonBucket[count];
          let selectedCourse = {'courseid' : course.courseid,
                                'coursename' : course.coursename}
          selectedArtBucket.push(selectedCourse);
          courseCommonBucket[count].selected = 'Y';
          creditArt += course.coursecredits;
        }
        count++;
      }
    }*/

    count = 0;
    while (creditArt < CREDITS_BUCKET_ART && count < courseCommonBucket.length) {
      if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].art == 't'){
        let course = courseCommonBucket[count];
        let selectedCourse = {'courseid' : course.courseid,
                              'coursename' : course.coursename,
                              'coursecredits' : course.coursecredits}
        selectedArtBucket.push(selectedCourse);
        courseCommonBucket[count].selected = 'Y';
        creditArt += course.coursecredits;
      }
      count++;
    }
  }

  if(creditSocial < CREDITS_BUCKET_SOCIAL){
    count = 0;
    while (creditSocial < CREDITS_BUCKET_SOCIAL && count < courseCommonBucket.length) {
      if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].social == 't'){
        let course = courseCommonBucket[count];
        let selectedCourse = {'courseid' : course.courseid,
                              'coursename' : course.coursename,
                              'coursecredits' : course.coursecredits}
        selectedSocialBucket.push(selectedCourse);
        courseCommonBucket[count].selected = 'Y';
        creditSocial += course.coursecredits;
      }
      count++;
    }
  }

  if(creditManagement < CREDITS_BUCKET_MANAGEMENT){
    count = 0;
    while (creditManagement < CREDITS_BUCKET_MANAGEMENT && count < courseCommonBucket.length) {
      if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].management == 't'){
        let course = courseCommonBucket[count];
        let selectedCourse = {'courseid' : course.courseid,
                              'coursename' : course.coursename,
                              'coursecredits' : course.coursecredits}
        selectedManagementBucket.push(selectedCourse);
        courseCommonBucket[count].selected = 'Y';
        creditManagement += course.coursecredits;
      }
      count++;
    }
  }

  /*
    Give an error if the buckets are not filled even with the common bucket
  */

  if(creditArt < CREDITS_BUCKET_ART || creditSocial < CREDITS_BUCKET_SOCIAL || creditManagement < CREDITS_BUCKET_MANAGEMENT){
    err = 'NO_COMBINATIONS';
  }else {

    data.push(selectedArtBucket);
    data.push(selectedSocialBucket);
    data.push(selectedManagementBucket);

    previousSelectedArtBucket = selectedArtBucket;
    previousSelectedSocialBucket = selectedSocialBucket;
    previousSelectedManagementBucket = selectedManagementBucket;

  }

  // console.log('----- ART -------');
  // console.log(selectedArtBucket);
  // console.log('----- SOCIAL -------');
  // console.log(selectedSocialBucket);
  // console.log('----- Management -------');
  // console.log(selectedManagementBucket);

  callback(err, data);

}

/*
  Function to give alternatives for Art Bucket
  When user ask to drop some course
*/

var creditArt = 0;          // current credits after the course is dropped

function dropArtBucketCourse(courseID, courseCredits, callback) {

  var data=[], error, count = 0;

  if(CREDITS_BUCKET_ART - courseCredits < 0){
    creditArt = 0;
  }else {
    creditArt = CREDITS_BUCKET_ART - courseCredits;;
  }

  while (count < courseArtBucket.length) {
    if(courseArtBucket[count].selected == 'N'){
      let course = courseArtBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}

      data.push(selectedCourse);
      //creditArt += course.coursecredits;
    }else {
      courseArtBucket[count].selected = 'N';
    }
    count++;
  }
  count = 0;
  while (count < courseCommonBucket.length) {
    if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].art == 't'){
      let course = courseCommonBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      data.push(selectedCourse);
      //creditArt += course.coursecredits;
    }else if (courseCommonBucket[count].selected == 'Y' && courseCommonBucket[count].art == 't') {
      courseCommonBucket[count].selected = 'N';
    }
    count++;
  }

  if(data.length < 1){
    error = 'Sorry :( , this is the only course under the Arts and Humanities category';
  }
  callback(error, data);
}

/*
  Function to give alternatives for Social Bucket
  When user ask to drop some course
*/

var creditSocial = 0;          // current credits after the course is dropped

function dropSocialBucketCourse(courseID, courseCredits, callback) {

  var data=[], error, count = 0;

  if(CREDITS_BUCKET_SOCIAL - courseCredits < 0){
    creditSocial = 0;
  }else {
    creditSocial = CREDITS_BUCKET_SOCIAL - courseCredits;;
  }

  while (count < courseSocialBucket.length) {
    if(courseSocialBucket[count].selected == 'N'){
      let course = courseSocialBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}

      data.push(selectedCourse);
      //creditSocial += course.coursecredits;
    }else {
      courseSocialBucket[count].selected = 'N';
    }
    count++;
  }
  count = 0;
  while (count < courseCommonBucket.length) {
    if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].social == 't'){
      let course = courseCommonBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      data.push(selectedCourse);
      //creditSocial += course.coursecredits;
    }else if (courseCommonBucket[count].selected == 'Y' && courseCommonBucket[count].social == 't') {
      courseCommonBucket[count].selected = 'N';
    }
    count++;
  }

  if(data.length < 1){
    error = 'Sorry :( , this is the only course under the Political and Social Sciences category';
  }
  callback(error, data);
}

/*
  Function to give alternatives for Management Bucket
  When user ask to drop some course
*/

var creditManagement = 0;          // current credits after the course is dropped

function dropManagementBucketCourse(courseID, courseCredits, callback) {

  var data=[], error, count = 0;

  if(CREDITS_BUCKET_MANAGEMENT - courseCredits < 0){
    creditManagement = 0;
  }else {
    creditManagement = CREDITS_BUCKET_MANAGEMENT - courseCredits;;
  }

  while (count < courseManagementBucket.length) {
    if(courseManagementBucket[count].selected == 'N'){
      let course = courseManagementBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}

      data.push(selectedCourse);
      //creditManagement += course.coursecredits;
    }else {
      courseManagementBucket[count].selected = 'N';
    }
    count++;
  }
  count = 0;
  while (count < courseCommonBucket.length) {
    if(courseCommonBucket[count].selected == 'N' && courseCommonBucket[count].management == 't'){
      let course = courseCommonBucket[count];
      let selectedCourse = {'courseid' : course.courseid,
                            'coursename' : course.coursename,
                            'coursecredits' : course.coursecredits}
      data.push(selectedCourse);
      //creditSocial += course.coursecredits;
    }else if (courseCommonBucket[count].selected == 'Y' && courseCommonBucket[count].management == 't') {
      courseCommonBucket[count].selected = 'N';
    }
    count++;
  }

  if(data.length < 1){
    error = 'Sorry :( , this is the only course under the Management and Economics category';
  }
  callback(error, data);
}


/*
  Function to add courses for Art Bucket
  When user ask to add some course
*/

function addArtBucketCourse(courses, callback) {

  console.log('Add Art ...');

  var data, error;

  for (var i = 0; i < courses.length; i++) {
    creditArt += courses[i][1];
  }

  if(creditArt >= CREDITS_BUCKET_ART){
    data = `OK`;
  }else {
    error = 'NOT_ENOUGH_CREDITS';
  }
  callback(error, data);
}

/*
  Function to add courses for Social Bucket
  When user ask to add some course
*/

function addSocialBucketCourse(courses, callback) {

  console.log('Add Social ...');

  var data, error;

  for (var i = 0; i < courses.length; i++) {
    creditSocial += courses[i][1];
  }

  if(creditSocial >= CREDITS_BUCKET_SOCIAL){
    data = `OK`;
  }else {
    error = 'NOT_ENOUGH_CREDITS';
  }
  callback(error, data);
}

/*
  Function to add courses for Management Bucket
  When user ask to add some course
*/

function addManagementBucketCourse(courses, callback) {

  console.log('Add Mang ...');

  var data, error;

  for (var i = 0; i < courses.length; i++) {
    creditManagement += courses[i][1];
  }

  if(creditManagement >= CREDITS_BUCKET_MANAGEMENT){
    data = `OK`;
  }else {
    error = 'NOT_ENOUGH_CREDITS';
  }
  callback(error, data);
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

/*
  Functions used to check the bucket the course is added
*/

function checkAddCourseBucket(courseID, callback){

  var data = [], err;
  for (var i = 0; i < courseSocialBucket.length; i++) {
    if(courseID == courseSocialBucket[i].courseid){
      data.push('social');
      data.push(courseSocialBucket[i].coursecredits);
    }
  }
  for (var i = 0; i < courseArtBucket.length; i++) {
    if(courseID == courseArtBucket[i].courseid){
      data.push('art');
      data.push(courseArtBucket[i].coursecredits);
    }
  }
  for (var i = 0; i < courseManagementBucket.length; i++) {
    if(courseID == courseManagementBucket[i].courseid){
      data.push('management');
      data.push(courseManagementBucket[i].coursecredits);
    }
  }
  for (var i = 0; i < courseCommonBucket.length; i++) {
    if(courseID == courseCommonBucket[i].courseid){
      data.push('common');
      data.push(courseCommonBucket[i].coursecredits);
    }
  }

  callback(err, data);
}

/*
  Functions used to check the bucket the course is dropped
*/

function checkDropCourseBucket(courseID, callback){

  var data = [], err;
  for (var i = 0; i < previousSelectedSocialBucket.length; i++) {
    if(courseID == previousSelectedSocialBucket[i].courseid){
      data.push('social');
      data.push(previousSelectedSocialBucket[i].coursecredits);
    }
  }
  for (var i = 0; i < previousSelectedArtBucket.length; i++) {
    if(courseID == previousSelectedArtBucket[i].courseid){
      data.push('art');
      data.push(previousSelectedArtBucket[i].coursecredits);
    }
  }
  for (var i = 0; i < previousSelectedManagementBucket.length; i++) {
    if(courseID == previousSelectedManagementBucket[i].courseid){
      data.push('management');
      data.push(previousSelectedManagementBucket[i].coursecredits);
    }
  }

  console.log('Drop bucket = ' + data);
  callback(err, data);
}

// function to get the day(Monday, Tuesday,.. of the week)
function getWeekDay(callback) {

  var data = weekday[new Date().getDay()-1];

  callback(data);

}

// function to get the next day
function getNextDay(day, callback) {

  var data;

  for (var i = 0; i < weekday.length; i++) {
    if(weekday[i] == day){
      if(i == 6){
        data = weekday[0];
      }else {
        data = weekday[i+1];
      }
    }
  }

  callback(data);

}

// function to get the next day
function getPreviousDay(day, callback) {

  var data;

  for (var i = 0; i < weekday.length; i++) {

    if(weekday[i] === day){
      if(i == 0){
        data = weekday[6];
      }else {
        data = weekday[i-1];
      }
    }
  }

  callback(data);

}

/*
    =============================================================================
    Functions used to view the DBs in the web browser
    =============================================================================
*/

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

// function to check user Chat client mappings
// here when user, requests <host>/userChatMap this function triggers.
app.get('/userChatMap', function (request, response) {

    console.log('===== db_query =====');

    var userList = [];

    client.query('SELECT * FROM table_user_map_chatclients', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        //console.log(result.rows);
	  		for (var i = 0; i < result.rows.length; i++) {

		  		var chatMap = {
		  			'eNumber':result.rows[i].registrationnumber,
		  			'facebookID':result.rows[i].facebookid,
		  			'whatsappID':result.rows[i].whatsappid,
		  			'viberID':result.rows[i].viberid,
            'twitterID':result.rows[i].twitterid
		  		}
		  		userList.push(chatMap);
	  	}
	  	response.render('pages/userchatmapping', {"userList": userList});  // use the userInfo.pug file to show data
    }
  });
});


// function to check short semester time table
// here when user, requests <host>/shortSem this function triggers.
app.get('/shortSem', function (request, response) {

    console.log('===== db_query =====');

    var timeTableList = [];

    client.query('SELECT * FROM table_current_semester_shortsem5', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        //console.log(result.rows);
	  		for (var i = 0; i < result.rows.length; i++) {

		  		var course = {
		  			'day':result.rows[i].timetabledate,
		  			'start':result.rows[i].starttime,
		  			'end':result.rows[i].endtime,
		  			'fos':result.rows[i].fieldofstudy,
            'id':result.rows[i].courseid
		  		}
		  		timeTableList.push(course);
	  	}
	  	response.render('pages/shortSem', {"timeTableList": timeTableList});  // use the shortSem.pug file to show data
    }
  });
});

// function to check general electives
// here when user, requests <host>/generalElectives this function triggers.
app.get('/generalElectives', function (request, response) {

    console.log('===== db_query =====');

    var courseList = [];

    client.query('SELECT * FROM table_course_general', function(err, result) {
      if (err){
        console.error(err); response.send("Error " + err);
      }else{
        //console.log(result.rows);
	  		for (var i = 0; i < result.rows.length; i++) {

          var bucket = '';

          if(result.rows[i].courseart){
            bucket += 'A ';
          }
          if(result.rows[i].coursemanagement){
            bucket += 'M ';
          }
          if(result.rows[i].coursesocial){
            bucket += 'S ';
          }

		  		var course = {
		  			'courseID':result.rows[i].courseid,
		  			'courseName':result.rows[i].coursename,
		  			'category':bucket,
		  			'credits':result.rows[i].coursecredits,
            'sem':result.rows[i].coursesem
		  		}

		  		courseList.push(course);
	  	}
	  	response.render('pages/generalElectives', {"courseList": courseList});  // use the shortSem.pug file to show data
    }
  });
});


//FACEBOOK VERIFICATION ----------------------------------------------------------------------------[facebook verification app]
app.get(
	'/verify-facebook',
	function (request, response) {
		console.log('===== got a facebook verification_code =====');
		var get_regno= request.query.regno;//$_GET["regno"]
		var get_client= request.query.client;//$_GET["client"]
		var get_verification_code= request.query.verification_code;//$_GET["verification_code"]
		var get_client_id= request.query.client_id;//$_GET["client_id"]client_id

		console.log(`GET regno '${get_regno}', client '${get_client}', veri '${get_verification_code}', client_id '${get_client_id}'`);

		//verification
		db_query_select_verification_code(get_regno,get_client,get_verification_code,get_client_id,response);
	}
);

app.get(
	'/verify',
	function (request, response) {
		console.log('===== send verification_code =====');
		var send_email_address= request.query.emailto;//$_GET["emailto"]
		email_send_verification_code(send_email_address);
	}
);

//--------------------------------------------------------------------------------------------[Show full course details]
app.get(
	'/course-detail',
	function (request, response) {
		console.log('===== time table =====');

		//get request parameters
		var get_courseid= request.query.courseid;//$_GET["courseid"] ?courseid=ef301
		var get_tablename='table_course_general';

		db_query_show_course_detail(get_courseid,get_tablename,response);

	}
);

function db_query_show_course_detail(get_courseid,get_tablename,response){

  console.log('======= db_query_show_course_detail =========');

  var res_course_id=get_courseid.toUpperCase();

  query = `select coursename, coursedescription, coursecredits from ${get_tablename} where courseid='${res_course_id}'`;
  console.log(query);

  var res_course_id=get_courseid.toUpperCase();
  var res_course_name='';
  var res_course_description='';
  //var res_course_credits='';


  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable

		res_course_name=result.rows[0].coursename;
		res_course_description=result.rows[0].coursedescription;
		//res_course_credits=result.rows[0].coursecredits;
		console.log('found result');


    }else {
      error = err || `No record found at general electives : db_query_show_course_detail`;
      //callback(error, data);
	  //return 'no-result-found';

	  console.log('error:'+error);



    }

	  //showing pug page, positive
		response.render('pages/coursedetail', {
		  course_id:res_course_id,
		  course_name:res_course_name,
		  course_description:res_course_description,
		  //course_credits:res_course_credits
		});


  });

}

//--------------------------------------------------------------------------------------------[Show Timetables]
app.get(
	'/timetable',
	function (request, response) {
		console.log('===== time table =====');

		//get request parameters
		var get_timetable= request.query.timetable;//$_GET["regno"]
		var get_field= request.query.field;//$_GET["regno"]
		//query database and put them into date_1,date_2.. array
		//and show
		db_query_show_timetable(get_timetable,get_field,response);

	}
);


function db_query_show_timetable(get_timetable,get_field,response){

  console.log('======= db_query_show_timetable =========');


		var slot_mon_1=[];
		var slot_tue_1=[];
		var slot_wed_1=[];
		var slot_thu_1=[];
		var slot_fri_1=[];
		var slot_sat_1=[];
		var slot_sun_1=[];

  let query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Monday' and fieldOfStudy='${get_field}' order by starttime;`;
  var error, data;
  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_mon_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	  //return 'no-result-found';
    }



  });

  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Tuesday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_tue_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	  //return 'no-result-found';
    }



  });


  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Wednesday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_wed_1.push(cr);
		}
    }else {
      error = err || `No record found at `;;
      //callback(error, data);
	  //return 'no-result-found';
    }



  });

  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Thursday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_thu_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	  //return 'no-result-found';
    }



  });

  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Friday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_fri_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	  //return 'no-result-found';
    }



  });

  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Saturday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_sat_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	 // return 'no-result-found';
    }



  });

  query = `select starttime,endtime,courseid from ${get_timetable} where timetabledate='Sunday' and fieldOfStudy='${get_field}' order by starttime;`;

  client.query(query, function(err, result) {
    if (!err && result.rows.length > 0){
      // If no Error get eNumber and query studentInfoTable
  //    let primary_email = result.rows[0].primaryemail;
//      console.log('primaryemail = ' + primary_email);
		var currentRow=0; var cr;
		for(currentRow=0;currentRow<result.rows.length;currentRow++){
			cr=result.rows[currentRow].courseid +" : FROM "+  result.rows[currentRow].starttime +" TO "+ result.rows[currentRow].endtime;
			console.log(cr);
			slot_sun_1.push(cr);
		}
    }else {
      error = err || `No record found at `;
      //callback(error, data);
	  //return 'no-result-found';
    }

	  	//showing pug page, positive
		response.render('pages/timetable', {
		  timetable_h1: '2017',
		  timetable_h_fieldname: get_field,

		  slot_mon_1: slot_mon_1,
		  slot_tue_1: slot_tue_1,
		  slot_wed_1: slot_wed_1,
		  slot_thu_1: slot_thu_1,
		  slot_fri_1: slot_fri_1,
		  slot_sat_1: slot_sat_1,
		  slot_sun_1: slot_sun_1,

		});

  });

}
