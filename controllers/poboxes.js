//Validator is used to validate and serialize data
var validator = require('validator');

//Used for hashing the user's password
var passwordHasher = require('password-hash-and-salt');

//Used to create the authentication strategy
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

//Misc functions
var helperFunctions = require('../helpers.js');

// //Location model
// var Location = require('../models/Location.js');

//POBox model
var POBox = require('../models/POBox.js');

//Statics Library
var StaticsLibrary = require('../static_data.js');

//Zipcode validator library
var i18nZipcodes = require('i18n-zipcodes');

//Moment JS is used for converting strings to date objects
var moment = require('moment');

//Static variables
var PO_BOX_NUMBER_LENGTH = 5;

//BetaUser library
var BetaUser = require('../models/BetaUser.js');

module.exports = function(app,express,db)
{
	//Configure passport
	passport.use(new LocalStrategy(
		{
			usernameField: 'box_number',
			passwordField: 'password'
		},
	  function(username, password, done) {
	  	POBox.findOne({friendly_box_number: username}, function(err, pobox)
	  	{
	  		if(!pobox)
	  		{
	        	return done(null, false, { message: 'PO Box is not valid!' });
	  		}
	  		passwordHasher(password).verifyAgainst(pobox.password, function(error, verified)
	  		{
	  			if(error)
	  			{
	        		return done(null, false, { message: 'An error occurred during login, please try again.' });
	  			}
	  			if(!verified)
	  			{
	        		return done(null, false, { message: 'Password is not valid!' });
	  			}

	  			return done(null,pobox);
	  		});
	  	});
	  }
	));
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
		POBox.findById(user._id, function(err, user)
		{
	  		done(err, user);
		});
	});

	//Creates new PO Box
	//Parameters: 	first_name - First name of the user
	//				email	   - Email address of the user
	//			    zip_code   - Zip code of the user
	//			    password   - Password to protect the PO Box
	app.post('/poboxes/register', helperFunctions.betaCheck, function(req, res, next)
	{
		//Get POST variables
		var first_name, 
			email,
			password,
			timezone;

		first_name = req.body.first_name;
		email = req.body.email;
		password = req.body.password;
		timezone = req.body.timezone;


		//Validate data
		var isValid = true;
		if(!validator.isEmail(email))
		{
			isValid = false;
			req.flash('error',"Hey, that's not a valid email!");
		}
		if(first_name.length <= 1)
		{
			isValid = false;
			req.flash('error', "Please enter your first name or we won't know what to call you!");
		}
		if(password.length < 5)
		{
			isValid = false;
			req.flash('error',"Let's at least use 5 characters in the password!");
		}
		//Validate timezone
		var found_timezone = false;
		for(var i in StaticsLibrary.Timezones)
		{
			if(i == timezone)
			{
				found_timezone = true;
				break;
			}
		}

		if(!found_timezone)
		{
			isValid = false;
			req.flash('error',"Invalid timezone, please choose one from the list!");
		}


		if(!isValid)
		{
			res.redirect('./login');
			return;
		}

		//Sanatize inputs
		first_name = validator.escape(first_name);
		email = validator.normalizeEmail(email);

		POBox.randomBoxNumber(function(result)
		{
			var box_number = result.box_number;
			var friendly_box_number = result.friendly_box_number;


			//Hash the password
			passwordHasher(password).hash(function(error,hash)
			{
				if(!error)
				{
					password = hash;

					var deliverytimeHour = Math.floor(Math.random() * 9) + 8;
					var deliverytimeMinutes = Math.floor(Math.random() * 3);
					deliverytimeMinutes = deliverytimeMinutes * 15;

					//Insert record into database
					var newBox = new POBox({
						"first_name": first_name,
						"email": email,
						"password": password,
						"box_number": box_number,
						"friendly_box_number": friendly_box_number,
						"messages": [],
						"timezone": timezone,
						"delivery_time_hour": deliverytimeHour,
						"delivery_time_minute": deliverytimeMinutes
					});

					newBox.save(function(err)
					{
						if(err)
							throw err;

						BetaUser.redeemKey(email, function()
						{
							req.login(newBox, function(err)
							{
								if(err)
									throw err;
								res.redirect('./post_register');
							});	
						});
					});

					
				}
				else
				{
					req.flash('error',"Oh no, looks like we ran into an error. Please try again!");
					res.redirect('./poboxes/login');
					return;
				}
			});
		});

	});

	//Post registration page that shows box number and delivery time
	app.get('/poboxes/post_register', helperFunctions.isAuthenticated, function(req,res)
	{
		POBox.nextDeliveryTimeObject(req.user._id, function(timeObject)
		{
			var delivery_time_string = timeObject.format("h:mm A");

			res.render('./poboxes/post_register',{
				errorMessages: req.flash('error'),
				user:req.user,
				delivery_time_string: delivery_time_string
			});
		});
	});

	//Returns the login page
	app.get('/poboxes/login', function(req,res){
		res.render('./poboxes/login',{
			errorMessages: req.flash('error'),
			timezones: StaticsLibrary.Timezones
		});
	});

	//Authenticates a PO Box.
	//Parameters: 	box_number - The PO Box number
	//				password   - The hashed password
	app.post('/poboxes/login', 
		passport.authenticate('local',{
			successRedirect: 'inbox',
			failureRedirect: 'login',
			failureFlash: "The POBox number or password you entered is incorrect. Let's give that another shot!"
		})
	);

	app.get('/poboxes/logout', function(req, res) {
		req.logout();
		req.flash('error','You have been logged out. Have a great day!');
		res.redirect('/');
	});

	//Searches boxes based on the parameter passed
	app.get('/poboxes/searchBoxes',helperFunctions.isAuthenticated, function (req, res, next) {
		var query = req.query.q;

		var re = new RegExp(query,'i');

		POBox.find().or([{'friendly_box_number': {$regex: re}},{'first_name': {$regex: re}}]).sort('first_name').exec(function(err, poboxes)
		{
			if(err)
				throw err;

			if(!poboxes)
				return;

			var resultsArray = [];


			for (var i = poboxes.length - 1; i >= 0; i--) {
				resultsArray.push({'first_name': poboxes[i].first_name, 'box_number': poboxes[i].box_number, 'id': poboxes[i]._id});
			}

			res.json(resultsArray);
		});
	});

}