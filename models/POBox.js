//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the POBox data schema
var poboxSchema = new Schema({
	box_number: {type: Number, required: true, unique: true},			//The unique PO Box number generated at account creation
	first_name: {type: String, required: true},							//User's first name
	password: {type: String, required: true},							//Hash of user's password
	email: {type: String},												//User's email used for notifications and recovery
	last_access: {type: Date},											//Time of last account access
	messages: {type: [Schema.ObjectId], ref: 'Message'},				//All messages associated with this account
	location: {type: Schema.ObjectId, ref: 'Location'},					//Associated Location object holding the zip code and delivery time
	permissions: {type: [String], default: ["user"]}
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

poboxSchema.statics.boxHasPermission = function(boxid,permission,callback)
{
	POBox.findById(boxid, function(err,result)
	{
		console.log("Checking for permissions: " + result.permissions);
		if(err)
			throw err;
		if(!result)
			callback(false);

		if(result.permissions.indexOf(permission) > -1)
		{
			callback(true);
		}
		else
		{
			callback(false);
		}
	});
}


//Create the model
var POBox = mongoose.model('POBox', poboxSchema);

//Export model so it can be used in our routes
module.exports = POBox;