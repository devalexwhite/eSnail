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
	  	console.log(username + "," + password);
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
	  done(null, user);
	});

	//Creates new PO Box
	//Parameters: 	first_name - First name of the user
	//				email	   - Email address of the user
	//			    zip_code   - Zip code of the user
	//			    password   - Password to protect the PO Box
	app.post('/poboxes/createBox', function(req, res, next)
	{
		//Get POST variables
		var first_name, 
			email,
			zip_code,
			password;

		first_name = req.body.first_name;
		email = req.body.email;
		zip_code = req.body.zip_code;
		password = req.body.password;


		//Validate data
		var isValid = true;
		console.log("Working on email: " + email);
		if(!validator.isEmail(email))
		{
			isValid = false;
		}

		if(!isValid)
		{
			console.log("Please enter a valid email");
			return;
		}

		//Sanatize inputs
		first_name = validator.escape(first_name);
		email = validator.normalizeEmail(email);
		zip_code = validator.escape(zip_code);

		//Get highest PO Box number
		POBox.findOne({}).sort('-box_number').exec(function (err, result)
		{
			var ponumber = 0;
			if(result)
			{
				ponumber = result.box_number + 1;
			}

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
						"box_number": ponumber,
						"messages": []
					});

					Location.getDeliveryTimeByZip(zip_code, function(location)
					{
						newBox.location = location;

						newBox.save(function(err)
						{
							if(err)
								throw err;

							console.log("Box saved");
							console.log(newBox);
						});
					});
					
				}
				else
				{
					console.log("Error hashing password!");
					return;
				}
			});
		});
	});

	app.get('/poboxes/listBoxes', function(req, res) {
		POBox.find().sort('-box_number').exec(function(err,result)
		{
			res.render('test', { poboxlist:  result});
		});
	});


	//Authenticates a PO Box.
	//Parameters: 	box_number - The PO Box number
	//				password   - The hashed password
	app.post('/poboxes/authorizeBox', 
		passport.authenticate('local',{
			successRedirect: '/',
			faileRedirect: '/',
			failureFlash: false
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