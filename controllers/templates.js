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
	//Administrative interface for managing templates, in the future this will need to be protected somehow
	//
	app.get('/templates/manage', function(req,res)
	{
		Template.find({}, function(err,results)
		{
			if(err)
				throw err;
		
			res.render('admin_templates',{"template_list": results});
		});
	});

	//
	//Administrative function to create a new template
	//
	app.post('/templates/create', function(req,res,next)
	{

		var template_file,
			content_lines;

		template_file = req.body.template_file;
		content_lines = req.body.content_lines;

		Template.createTemplate(template_file, content_lines, function(result)
		{
			Template.find({}, function(err,results)
			{
				if(err)
					throw err;
				res.render('admin_templates',{"template_list": results});
			});
		});
	});


	//
	//Administrative function to delete a template
	//
	app.get('/templates/delete/:id', function(req,res,next)
	{
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
	});
}