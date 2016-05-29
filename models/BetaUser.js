//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the BetaUser data schema
var betaUserSchema = new Schema({
	email: {type: String, required:true},								//Email address of the user
	beta_access_allowed: {type: Boolean, default: false},				//Whether or not the user has beta access
	beta_key: {type: String},											//The user's beta key
	key_used: {type: Boolean, default: false},							//Switches to true when a key has been redeemed
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Create the model
var BetaUser = mongoose.model('BetaUser', betaUserSchema);

//Export model so it can be used in our routes
module.exports = BetaUser;