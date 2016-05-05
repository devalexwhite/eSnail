//Validator is used to validate and serialize data
var validator = require('validator');

//Misc functions
var helperFunctions = require('../helpers.js');

//POBox model
var POBox = require('../models/POBox.js');

//Location model
var Location = require('../models/Location.js');

//Message model
var Message = require('../models/Message.js');

module.exports = function(app,express,db)
{

	//Sends a message from the current user's PO Box to a recipient
	//Parameters: 		 			-			Number of messages to list
	//				begin 			- 			Message to start list with
	//				sort  			- 			Sort option. 0 for descending, 1 for ascending
	//				sortParam		-			Field to sort on. 0 for sent time, 1 for read
	app.post('/messaging/sendMessage', helperFunctions.isAuthenticated, function(req, res) {
		console.log(req.body.bears);
	});

	//Returns a view with all the logged in user's messages
	//Parameters: 	count 			-			Number of messages to list
	//				begin 			- 			Message to start list with
	//				sort  			- 			Sort option. 0 for descending, 1 for ascending
	//				sortParam		-			Field to sort on. 0 for sent time, 1 for read
	app.get('/messaging/displayMessageList', helperFunctions.isAuthenticated, function(req, res) {
		var toReturnObject = {
			user_firstName: req.user.first_name,
			user_messages: req.user.messages
		}

		console.log(toReturnObject);

		var sort = 0;
		var sortParam = 0;

		if(req.query.sort)
			sort = req.query.sort;
		if(req.query.sortParam)
			sortParam = req.query.sortParam; 


		if(sortParam == 0)
		{
			if(sort == 0)
			{
				toReturnObject.user_messages = toReturnObject.user_messages.sort(compareTimeDES);
			}
			else
			{
				toReturnObject.user_messages = toReturnObject.user_messages.sort(compareTimeASC);
			}
		}
		else
		{
			if(sort == 0)
			{
				toReturnObject.user_messages = toReturnObject.user_messages.sort(compareReadDES);
			}
			else
			{
				toReturnObject.user_messages = toReturnObject.user_messages.sort(compareReadASC);
			}
		}
		
		res.render('inbox', toReturnObject);
	});

	function compareTimeASC(a,b) {
		if (a.sent_time < b.sent_time)
			return -1;
		else if (a.sent_time > b.sent_time)
			return 1;
		else 
			return 0;
	}
	function compareTimeDES(a,b) {
		if (a.sent_time > b.sent_time)
			return -1;
		else if (a.sent_time < b.sent_time)
			return 1;
		else 
			return 0;
	}
	function compareReadASC(a,b) {
		if (a.message_read < b.message_read)
			return -1;
		else if (a.message_read > b.message_read)
			return 1;
		else 
			return 0;
	}
	function compareReadDES(a,b) {
		if (a.message_read > b.message_read)
			return -1;
		else if (a.message_read < b.message_read)
			return 1;
		else 
			return 0;
	}
} 