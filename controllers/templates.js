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
	//Displays the template selector
	//
	app.get('/poboxes/template_list', helperFunctions.isAuthenticated, function(req,res)
	{
		//Gather all available templates
		Template.find({}, function(err,templates)
		{
			if(err)
				throw err;
			
			//Render the compose screen
			res.render('./poboxes/template_list', {user: req.user, 
				errorMessages: req.flash('error'),
				templates: templates
			});
		});
	});

	//
	//Administrative interface for managing templates, in the future this will need to be protected somehow
	//
	app.get('/templates/manage',helperFunctions.isAuthenticated, function(req,res)
	{
		// POBox.boxHasPermission(req.user._id,"administrator",function(result)
		// {
			// if(!result)
			// {
			// 	res.sendStatus(403);
			// 	return;
			// }
			Template.find({}, function(err,results)
			{
				if(err)
					throw err;
			
				res.render('admin_templates',{"template_list": results});
			});
		// });
	});

	//
	//Administrative function to create a new template
	//
	app.post('/templates/create',helperFunctions.isAuthenticated, function(req,res,next)
	{
		// POBox.boxHasPermission(req.user._id,"administrator",function(result)
		// {
			var template_file,
				content_lines,
				preview_image,
				title,
				short_description;

			template_file = req.body.template_file;
			content_lines = req.body.content_lines;
			preview_image = req.body.preview_image;
			title = req.body.title;
			short_description = req.body.short_description;

			Template.createTemplate(template_file, content_lines, preview_image,title, short_description, function(result)
			{
				Template.find({}, function(err,results)
				{
					if(err)
						throw err;
					res.render('admin_templates',{"template_list": results});
				});
			});
		// });
	});


	//
	//Administrative function to delete a template
	//
	app.get('/templates/delete/:id',helperFunctions.isAuthenticated, function(req,res,next)
	{
		// POBox.boxHasPermission(req.user._id,"administrator",function(result)
		// {
			var templateID;

			templateID = req.params.id;

			Template.findById(templateID, function(err,result)
			{
				if(err)
					throw err;
				if(result)
				{
					result.remove(function(err)
					{
						if(err)
							throw err;

					});
					Template.find({}, function(err,results)
					{
						if(err)
							throw err;
						res.render('admin_templates',{"template_list": results});
					});
				}
			});
		// });
	});

	//
	//Render the template
	//
	app.get('/templates/render/:messageID', helperFunctions.isAuthenticated, function(req,res,next)
	{
		var messageID;

		messageID = req.params.messageID;

		//Load the current user's messages
		POBox.findById(req.user._id,function(error,user)
		{
			if(user.messages.indexOf(messageID) > -1)
			{
				Template.getTemplateFromMessage(messageID,function(template)
				{	
					if(!template)
					{
						res.sendStatus(500);
						return;
					}
				});
			}
			else
			{
				res.sendStatus(403);
			}
		});
	});
}