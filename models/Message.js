//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the Message data schema
var messageSchema = new Schema({
	title: {type: String, required: true},								//Title of the message
	sender_po_box: {type: Number, required: true},						//Sender's POBox number
	content: [String],													//Array of content strings
	template: {type: String, required: true},							//Jade template file name (excluding .js)
	pobox: {type: Schema.ObjectID, ref: 'POBox'}						//Recipient's POBox
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Create the model
var Message = mongoose.model('Message', messageSchema);

//Export model so it can be used in our routes
module.exports = Message;