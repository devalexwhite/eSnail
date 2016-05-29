//BetaUser model
var BetaUser = require('../models/BetaUser.js');

//Validator is used to validate and serialize data
var validator = require('validator');

module.exports = function(app,express,db)
{
	app.post('/beta/signup', function(req,res)
	{
		var email;
		//Grab email for the beta user
		email = req.body.email;

		var isValid = true;
		if(!validator.isEmail(email))
		{
			isValid = false;
			req.flash('error',"Hey, that's not a valid email!");
		}

		if(!isValid)
		{
			res.redirect('/');
			return;
		}

		BetaUser.find({"email": email}, function(err,result)
		{
			if(result.length > 0)
			{
				req.flash('error',"We know you're excited for eSnail, but you don't need to signup twice!");
				res.redirect('/');
				return;
			}
			var newUser = new BetaUser({
				"email": email
			});

			//Save the new beta user object
			newUser.save(function(err){
				res.redirect('/beta/signup');
			});
		});


	});

	app.get('/beta/signup', function(req,res)
	{
		res.render('./beta/signup',{
			errorMessages: req.flash('error'),
			user:req.user
		});
	});
}