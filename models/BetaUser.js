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

//
//Generate the beta key when the beta user is inserted
//
betaUserSchema.pre('save', function(next)
{
	if(this.beta_key && this.beta_key != '')
	{
		next();
		return;
	}

	var key = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 8; i++ )
	    key += possible.charAt(Math.floor(Math.random() * possible.length));

	this.beta_key = key;

	next();
});

//
//Mark the beta key with given associated email as reedemed
//
betaUserSchema.statics.redeemKey = function(email, callback)
{
	BetaUser.findOne({"email": email}, function(err,result)
	{
		if(err)
			throw err;

		if(!result)
		{
			callback();
		}

		result.key_used = true;

		result.save(function(err)
		{
			if(err)
				throw err;

			callback();
		});

	});
}

//Create the model
var BetaUser = mongoose.model('BetaUser', betaUserSchema);

//Export model so it can be used in our routes
module.exports = BetaUser;