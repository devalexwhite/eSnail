//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the Template data schema
var templateSchma = new Schema({
	template_file: {type: String, required: true},			//The template file to use (excludes the .js postfix)
	content_lines: {type: Number, required: true}			//Number of content lines the template uses
});

//Static for creating a new template
templateSchma.statics.createTemplate = function(template_file, content_lines,callback)
{
	var newTemplate = Template({
		"template_file": template_file,
		"content_lines": content_lines
	});

	newTemplate.save(function(err)
	{
		if(err)
			throw err;
		callback(newTemplate);
	});
}

//Create the model
var Template = mongoose.model('Template', templateSchma);

//Export model so it can be used in our routes
module.exports = Template;