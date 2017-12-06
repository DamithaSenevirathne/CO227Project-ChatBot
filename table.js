//-------------------------------------------------------------------------------------------------------[database connection]
//postgres database url
const DATABASE_URL = 'postgres://dcfvnzofeempgk:2c027d6f6788c5b82e4cbb9e9d388254211a61156d1fc1e35312c8c5885958aa@ec2-107-22-167-179.compute-1.amazonaws.com:5432/d3teg1g8u2anm';


const { Client } = require('pg');

//database connection information? database instance
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: true,
});

client.connect(); //connecting to the database? client database instance

//---------------------------
var express = require('express') //a minimal and flexible Node.js web application framework that provides a robust set of features to develop web and mobile applications.
, bodyParser = require('body-parser'); //this is a node.js middleware for handling JSON, Raw, Text and URL encoded form data.

var http = require('http');
var request = require('request');

var app = express(); //getting an express instance , app?

const pug = require('pug');

//nodejs server online port
const PORT = process.env.PORT || 5000;


app.set("view engine", "pug");

// set the port your listening
app.listen(PORT);
console.log('listening to port : ' + PORT);

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



