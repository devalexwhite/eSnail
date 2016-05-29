//
// HELPER FUNCTIONS
//

//Statics Library
var StaticsLibrary = require('./static_data.js');

//BetaUser Model
var BetaUser = require('./models/BetaUser.js');

var helpers = function() {}

//Converts the database integer to the 5 digit PO Number
helpers.prototype.intToPONumber = function (num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// Middleware for determining if the current user is authenticated
helpers.prototype.isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated())
	{
		return next();
	}
	req.flash('error',"You must be logged in to do that!");
	res.redirect('/poboxes/login');
}

//
//Function to check if the beta email and key match
//
helpers.prototype.betaCheck = function(req, res, next)
{
	var email,
		betakey;

	email = req.body.email;
	betakey = req.body.betakey;

	BetaUser.findOne({"email":email}, function(err, betaUser)
	{
		if(err)
			throw err;

		if(!betaUser)
		{
			req.flash('error',"Invalid Beta Key, if you want to join the beta, please signup on the homepage!");
			res.redirect('/poboxes/login');
			return;
		}

		if(betaUser.beta_key != betakey)
		{
			req.flash('error',"Invalid Beta Key. If you want to join the beta, please signup on the homepage!");
			res.redirect('/poboxes/login');
			return;
		}

		if(!betaUser.beta_access_allowed)
		{
			req.flash('error',"This beta key is no longer valid!");
			res.redirect('/poboxes/login');
			return;	
		}

		if(betaUser.key_used)
		{
			req.flash('error',"This key has already been redeemed!");
			res.redirect('/poboxes/login');
			return;
		}

		next();
	});
}

module.exports = new helpers();