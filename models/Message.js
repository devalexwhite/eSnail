//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the Message data schema
var messageSchema = new Schema({
	title: {type: String, required: true},								//Title of the message
	sender_po_box: {type: Number, required: true},						//Sender's POBox number
	content: [String],													//Array of content strings
	template: {type: String, required: true},							//Jade template file name (excluding .js)
	pobox: {type: Schema.ObjectId, ref: 'POBox'}						//Recipient's POBox
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Sends a message to the specified POBox
//Parameters: 	sender 			-	POBox object of the message sender
//				recipient 		-	POBox object of the recipient
//				title 			-	String of the message title
// 				content 		- 	Array of strings for the content
// 				template 		-	String with the template filename
//Returns: 		Message object
//Returns: Location object
messageSchema.statics.sendMessage = function(sender, recipient, title, content, template,callback)
{
	var newMessage = Message(
	{
		"title": title,
		"sender_po_box": sender,
		"content": content,
		"pobox": recipient,
		"template": template
	});

	newMessage.save(function(err)
	{
		if(err)
			throw err;

		callback(newMessage);
	});
}

//Create the model
var Message = mongoose.model('Message', messageSchema);

//Export model so it can be used in our routes
module.exports = Message;