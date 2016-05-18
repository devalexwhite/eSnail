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

//Template model
var Template = require('../models/Template.js');

module.exports = function(app,express,db)
{
	//
	//Get handler for displaying the send message screen
	//
	app.get('/poboxes/compose', helperFunctions.isAuthenticated, function(req,res)
	{
		//Gather all available templates
		var template_id = validator.escape(req.query.template_id);

		Template.findById(template_id, function(err,template)
		{
			
			if(!template || err)
			{
				req.flash('error','Invalid style choosen, please try again!');
				res.redirect('./template_list')
				return;
			}

			//Render the template so we can send it to the compose screen
			res.render('./message_templates/' + template.template_file, function(err,result)
			{
				if(err)
					throw err;

				if(!result)
				{
					req.flash('error','We seem to be having a problem with that template, please try another!');
					res.redirect('./template_list')
					return;
				}
				else
				{
					//Render the compose screen and pass along the rendered template
					res.render('./poboxes/compose', {user: req.user, 
						errorMessages: req.flash('error'),
						rendered_template: result
					});
				}
			});
		});
	});


	//Sends a message from the current user's PO Box to a recipient. This
	//Parameters: 		 	
	//				recipient_box_number		- 			POBox number of recipient
	//				title  						- 			String with message title
	//				template					-			String with template file name
	//				number_content_lines		-			The number of body lines in request
	//				content_line_#				-			A line for the body, where # is the line number
	app.post('/messaging/sendMessage',helperFunctions.isAuthenticated, function(req, res) {
		var recipient_box_number,
			title,
			template,
			number_content_lines,
			content_lines;

		//Grab variables from the body
		recipient_box_number = req.body.recipient_box_number;
		title = req.body.title;
		template = req.body.template;
		number_content_lines = req.body.number_content_lines;
		content_lines = new Array();

		//Check the variables are set
		if(!recipient_box_number || !title || !template || !number_content_lines)
			return;

		//Sanatize inputs
		recipient_box_number = parseInt(recipient_box_number);
		number_content_lines = parseInt(number_content_lines);
		title = validator.escape(title);

		//Build the content object
		for (var i=0;i<number_content_lines;i++) {
			content_lines.push(validator.escape(req.body["content_line_" + i]));
		}

		//Load the recipient's PO Box
		POBox.find({box_number: recipient_box_number}, function(err,foundBox)
		{
			if(err)
				throw err;
			if(!foundBox)
			{
				return;
			}

			//Got the box, so compose the message
			Message.sendMessage(req.user._id,foundBox[0]._id,title,content_lines,template,function(message)
			{
			});
		});
	});

	//Returns a view with all the logged in user's messages
	//Parameters: 	count 			-			Number of messages to list
	//				begin 			- 			Message to start list with
	//				sort  			- 			Sort option. 0 for descending, 1 for ascending
	//				sortParam		-			Field to sort on. 0 for sent time, 1 for read
	app.get('/poboxes/inbox', helperFunctions.isAuthenticated, function(req, res) {
		//Simplified object to return, don't want to return a users password
		Message.find({'_id':{$in: req.user.messages}}, function(err, messages)
		{
			//Get the time until delivery
			POBox.timeStringUntilDelivery(req.user._id, function(result)
			{
				//Render the inbox, providing the messages, user object, and status messages
				res.render('./poboxes/inbox', {user: req.user, 
					messages: messages,
					errorMessages: req.flash('error'), 
					time_until_delivery: result
				});
			});
		});
	});

	//Deletes message with given id from current user's account
	//Parameters: 	messageID		-			The id of the message to delete
	app.get('/messaging/deleteMessage/:messageID', helperFunctions.isAuthenticated, function(req, res) {
		console.log(req.user.messages);

		var messageID;

		messageID = req.params.messageID;

		//Check that the messageID exists in the array, don't delete someone else's messages!
		Message.findById(messageID, function(err, message)
		{
			if(err || !message)
			{
				res.sendStatus(401);
				return;
			}
				
			message.remove(function(err)
			{
				if(err)
					throw err;

				res.render('inbox', toReturnObject);
			});
		});
	});
} 