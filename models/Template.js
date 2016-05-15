//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Message model
var Message = require('../models/Message.js');

//Setup the Template data schema
var templateSchema = new Schema({
	template_file: {type: String, required: true},			//The template file to use (excludes the .js postfix)
	content_lines: {type: Number, required: true},			//Number of content lines the template uses
	preview_image: {type: String},							//Filename of the preview image. Path is relative to /www/img/templates
	stamp_cost: {type: Number, default: 0},					//To be implemented, cost of the template
	title: {type: String, required: true},					//Title of the template
	short_description: {type:String}						//Optional short description of the template
});

//Static for creating a new template
templateSchema.statics.createTemplate = function(template_file, content_lines,preview_image,title, short_description, callback)
{
	var newTemplate = Template({
		"template_file": template_file,
		"content_lines": content_lines,
		"preview_image": preview_image,
		"title": title,
		"short_description": short_description
	});

	newTemplate.save(function(err)
	{
		if(err)
			throw err;
		callback(newTemplate);
	});
}

//Return the template object from a message id, and authenticate it with user object
templateSchema.statics.getTemplateFromMessage = function(messageID,callback)
{
		Message.findById(messageID, function(err,message)
		{
			if(err)
				throw err;
			if(!message)
				callback(null);

			Template.findById(message.template,function(err,template)
			{
				if(err)
					throw err;
				if(!template)
					callback(null);

				callback(template);
			});
		});
}

//Create the model
var Template = mongoose.model('Template', templateSchema);

//Export model so it can be used in our routes
module.exports = Template;