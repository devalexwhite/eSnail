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
						rendered_template: result,
						template_id: template_id
					});
				}
			});
		});
	});

	//
	//Post handler that sends the message
	//
	app.post('/poboxes/compose',helperFunctions.isAuthenticated, function(req,res)
	{
		//Gather variables
		var recipient_box_number,
			template_values,
			template_id;

		template_id = req.body.template_id;
		recipient_box_number = req.body.recipient_box_number;

		//Find the template to operate on
		Template.findById(template_id, function(err, template)
		{
			if(err)
				throw err;

			if(!template)
			{
				req.flash('error',"Hmm, something seems to be wrong with the template, please try again!");
				res.redirect('/poboxes/compose');
			}

			//Gather the content lines from the request
			var content_lines = template.content_lines;

			var content = [];

			//Build the key-value object to store the content
			for(var i=0; i < content_lines; i++)
			{
				var cKey = req.body['template_values['+i+'][key]'];
				var cValue = req.body['template_values['+i+'][value]'];

				content.push({line_key: cKey,line_content: cValue});
			}

			//Verify the recipient
			POBox.findById(recipient_box_number, function(err,recipient)
			{
				if(err)
					throw err;

				if(!recipient)
				{
					req.flash('error',"We couldn't find the specified recipient PO Box, please try again!");
					res.redirect('/poboxes/compose');	
				}

				//Looks like we are 5x5, let's send that beautiful message
				Message.sendMessage(req.user._id,recipient_box_number,content,template_id,function(message)
				{
					if(!message)
					{
						req.flash('error',"Oh no, we failed to send the message! Please try again, we'll try harder this time (promise).");
						res.redirect('/poboxes/compose');						
					}

					res.send(message._id);						
				});
			});
		});

	});

	app.get('/poboxes/sent/:messageID', function(req,res)
	{
		//Lookup the message
		Message.findById(req.params.messageID, function(err,message)
		{
			if(err)
				throw err;

			if(!message)
			{
				req.flash('error',"Something went wrong and we can't find the message we just sent...");
				res.redirect('/poboxes/compose');		
			}

			POBox.findById(message.pobox, function(err,pobox)
			{
				if(err)
					throw err;

				if(!pobox)
				{
					req.flash('error',"Something went wrong, please try again.");
					res.redirect('/poboxes/compose');		
				}

				POBox.timeStringUntilDelivery(pobox._id, function(result)
				{
					res.render('./poboxes/sent',
					{
						recipient_first_name: pobox.first_name,
						delivery_time: result,
					 	errorMessages: req.flash('error'),
					});
				});
			});
		});
	});

	//Returns a view with all the logged in user's messages
	//Parameters: 	count 			-			Number of messages to list
	//				begin 			- 			Message to start list with
	//				sort  			- 			Sort option. 0 for descending, 1 for ascending
	//				sortParam		-			Field to sort on. 0 for sent time, 1 for read
	app.get('/poboxes/inbox', helperFunctions.isAuthenticated, function(req, res) {
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