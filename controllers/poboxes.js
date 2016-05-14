//Validator is used to validate and serialize data
var validator = require('validator');

//Used for hashing the user's password
var passwordHasher = require('password-hash-and-salt');

//Used to create the authentication strategy
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

//Misc functions
var helperFunctions = require('../helpers.js');

//Location model
var Location = require('../models/Location.js');

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

module.exports = function(app,express,db)
{
	//Configure passport
	passport.use(new LocalStrategy(
		{
			usernameField: 'box_number',
			passwordField: 'password'
		},
	  function(username, password, done) {
	  	POBox.findOne({box_number: username}, function(err, pobox)
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
	app.post('/poboxes/register', function(req, res, next)
	{
		//Get POST variables
		var first_name, 
			email,
			zip_code,
			password,
			country;

		first_name = req.body.first_name;
		email = req.body.email;
		zip_code = req.body.zip_code;
		password = req.body.password;
		country = req.body.country;


		//Validate data
		var isValid = true;
		if(!validator.isEmail(email))
		{
			isValid = false;
			req.flash('error',"Hey, that's not a valid email!");
		}
		if(!i18nZipcodes(country,zip_code))
		{
			isValid = false;
			req.flash('error',"That zip code doesn't seem to exist in that country!");
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



		if(!isValid)
		{
			res.redirect('./login');
			return;
		}

		//Sanatize inputs
		first_name = validator.escape(first_name);
		email = validator.normalizeEmail(email);
		zip_code = validator.escape(zip_code);

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

					//Insert record into database
					var newBox = new POBox({
						"first_name": first_name,
						"email": email,
						"password": password,
						"box_number": box_number,
						"friendly_box_number": friendly_box_number,
						"country": country,
						"messages": []
					});

					Location.getDeliveryTimeByZip(zip_code, function(location)
					{
						newBox.location = location;

						newBox.save(function(err)
						{
							if(err)
								throw err;

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
		res.render('./poboxes/post_register',{errorMessages: req.flash('error'),user:req.user});
	});

	//Returns the login page
	app.get('/poboxes/login', function(req,res){
		res.render('./poboxes/login',{errorMessages: req.flash('error'),countries: StaticsLibrary.Countries});
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
		res.redirect('/');
	});


	//Query database for zipcode, create if not exists.
	//Parameters: zipcode - The zipcode to check
	//Returns: String in format of HH:MM that marks 24h format for delivery time
	app.get('/poboxes/getDeliveryTime/:zip_code', function (req, res, next) {
		Location.getDeliveryTimeByZip(req.params.zip_code, function(location)
		{
			res.send(location.delivery_time);
		});

	});

}