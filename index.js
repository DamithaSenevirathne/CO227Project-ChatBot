
// https://vast-peak-63221.herokuapp.com/

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
	  text: 'Please click this link to verify your request : https://vast-peak-63221.herokuapp.com/verify-facebook?regno='+current_registrationnumber+'&client=facebook&verification_code='+verification_code+'&client_id='+current_facebook_id
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

				  let query = `insert into table_user_map_chatClients(registrationnumber, facebooid, whatsappid, viberid, twitterid) values('${confirmed_regnumber}','${client_id}','NONE','NONE','NONE');`;
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
const PORT = process.env.PORT || 5000;

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
      }else {
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }

    });

  }
  // Need to query the DB using the time for the second time (A next followed by 1st query)
  if(action == 'ACTION_QUERY_BY_TIME_NEXT'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    console.log(query_by_time_previous_endtime);
    queryByTimeNext(query_by_time_previous_endtime, facebookID, function (err, data) {
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
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
      }

    });
  }
  // Need to query the DB using the time for the second time (A previous followed by 1st query)
  if(action == 'ACTION_QUERY_BY_TIME_PREVIOUS'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    console.log(query_by_time_previous_starttime);
    queryByTimePrevious(query_by_time_previous_starttime, facebookID, function (err, data) {
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
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
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
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
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
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
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
        res.send(JSON.stringify({'messages': [{"type": 0, "speech": err}]}))
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
   query_by_courseID_specified_courseID = request.body.result.parameters.CourseID;      // courseID specified by user

   query_by_courseID_specified_day = moment(request.body.result.parameters.date).format('dddd');   // day specified by user
   queryByCourseID_Date(query_by_courseID_specified_courseID, query_by_courseID_specified_day,facebookID, function (err, data) {
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
      Actions used to query timetables using the courseID
    =============================================================================
  */

    // Need to query the DB using the courseID
    if(action == 'ACTION_QUERY_BY_COURSEID'){

    let facebookID = request.body.originalRequest.data.sender.id;       // facebook id
    query_by_courseID_specified_courseID = request.body.result.parameters.CourseID;      // courseID specified by user

    queryByCourseID(query_by_courseID_specified_courseID,facebookID, function (err, data) {
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
      Actions used to Query the Full Timetables
      =============================================================================
  */

  if(action == 'ACTION_QUERY_FULL'){

    let facebookID = request.body.originalRequest.data.sender.id;           // facebook id

    queryFullTimeTable(facebookID, function (err, data) {
      if(!err){

        let path = 'https://vast-peak-63221.herokuapp.com/' + data;        
	  
        //var reply = {'messages': [{"type": 0, "speech": path}]}       

        //res.send(JSON.stringify(reply))
	      
	 var reply = {
              'data':{
                "facebook": {
                  "attachment": {
                    "type": "template",
                    "payload": {
                      "template_type": "button",
                      "text":'Full Timetable',
                      "buttons": [{
                        "type":"web_url",
                        "url":`${path}`,
                        "title":"Show"
                      }]
                    }
                  }
                }
              }
            }
        //var reply = {'messages': [{"type": 0, "speech": path}]}

        res.send(JSON.stringify(reply))     
	      
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
      error = err || `Looks like you are not registered yet`;
      callback(error, data);
    }

  });
}

/*
  ==============================================================================
  Functions used to query the DB by CourseID and days
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
      error = err || `Looks like you are not registered yet`;
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
      error = err || `Looks like you are not registered yet`;
      callback(error, data);
    }

  });
}

//function to query the DB by time(user say next followed by 1st query)  e.g -> What do i have at 2pm ? Next ?
function queryByTimeNext(time, facebookId, callback){

  console.log('======= Query By Time Next =========');

  var error, data;

  query = `Select * FROM ${table_to_query} WHERE timetabledate='${query_by_time_date}' AND starttime>='${time}' order by starttime;`;

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
function queryByTimePrevious(time, facebookId, callback){

console.log('======= Query By Time Before =========');

var error, data;

query = `Select * FROM ${table_to_query} WHERE timetabledate='${query_by_time_date}' AND endtime<='${time}' order by endtime DESC;`;

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
      error = err || `Looks like you are not registered yet`;
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
      error = err || `Looks like you are not registered yet`;
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
