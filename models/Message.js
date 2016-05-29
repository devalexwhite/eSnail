//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//POBox model
var POBox = require('../models/POBox.js');

//Setup the Message data schema
var messageSchema = new Schema({
	sender_po_box: {type: Schema.ObjectId, ref:'POBox', required:true},						//Sender's POBox number
	content: [{
		line_key: {type: String},
		line_content: {type: String}
	}],																			//Array of content strings
	template: {type: Schema.ObjectId, ref:'POBox', required: true},							//Jade template file name (excluding .js)
	pobox: {type: Schema.ObjectId},												//Recipient's POBox
	deleted: {type: Boolean, default: false},									//Has the message expired?
	delivery_time: {type: Date}													//When the message will be delivered
},
{
	timestamps: true															//Mongoose will automatically add createdAt and updatedAt
});

//Sends a message to the specified POBox
//Parameters: 	sender 			-	POBox object of the message sender
//				recipient 		-	POBox object of the recipient
//				title 			-	String of the message title
// 				content 		- 	Array of strings for the content
// 				template 		-	String with the template filename
//Returns: 		Message object
//Returns: Location object
messageSchema.statics.sendMessage = function(sender, recipient, content, template,delivery_time_object,callback)
{
	//Generate the message object
	var newMessage = Message(
	{
		"sender_po_box": sender,
		"content": content,
		"pobox": recipient,
		"template": template,
		"delivery_time": delivery_time_object
	});

	//Save the message
	newMessage.save(function(err)
	{
		if(err)
			throw err;

		//Now we add the message to the recipients box
		POBox.findById(newMessage.pobox, function(err, recipientBox)
		{
			recipientBox.messages.push(newMessage._id);
			recipientBox.save(function(err)
			{
				callback(newMessage);
			});
		});

	});
}

//Deletes a message
//Parameters: 	message 		-	Message object to delete
//Returns: 		True/False depending on result
messageSchema.statics.deleteMessage = function(message)
{
	var idToDelete = message._id;

	message.remove(function(err)
	{
		if(err)
			return false;
		return true;
	});
}

//Create the model
var Message = mongoose.model('Message', messageSchema);

//Export model so it can be used in our routes
module.exports = Message;