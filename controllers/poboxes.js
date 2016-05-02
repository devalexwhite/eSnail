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
	//			    zipcode    - Zip code of the user
	//			    password   - Password to protect the PO Box
	app.post('/poboxes/createBox', function(req, res, next)
	{
		//Get POST variables
		var first_name, 
			email,
			zipcode,
			password;

		first_name = req.body.first_name;
		email = req.body.email;
		zipcode = req.body.zipcode;
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
		zipcode = validator.escape(zipcode);

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
						"zip_code": zipcode,
						"password": password,
						"box_number": ponumber,
						"delivery_time": "12:45"
					});

					newBox.save(function(err)
					{
						if(err)
							throw err;

						console.log("Box saved");
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
	app.get('/poboxes/getDeliveryTime/:zipcode', function (req, res, next) {

		Location.findOne({zip_code: req.params.zipcode}).exec(function(err, result)
		{
			if(err)
				throw err;
			if(result)
			{
				console.log(result.delivery_time);
			}
			else
			{
				console.log("Creating new location record");

				//Generate the delivery time. Delivery time is in 24hr format. Minutes can be:
				//:00
				//:15
				//:30
				//:45
				var deliverytimeHour = Math.floor(Math.random() * 24);
				var deliverytimeMinutes = Math.floor(Math.random() * 3);
				deliverytimeMinutes = deliverytimeMinutes * 15;
				var deliveryTimeString = deliverytimeHour + ':' + deliverytimeMinutes;

				var newLocation = Location(
				{
					"zip_code": req.params.zipcode,
					"delivery_time": deliveryTimeString
				});

				newLocation.save(function(err)
				{
					if(err)
						throw err;

					console.log("Saved delivery time. Zip: " + newLocation.zip_code + " Time: " + newLocation.delivery_time);
				});
			}
		});

		// if(deliveryWindows_Collection)
		// {
		// 	//Search for the zipcode
		// 	var document = deliveryWindows_Collection.findOne({zipcode: req.params.zipcode},function(err,document)
		// 	{
		// 			if(document)
		// 			{
		// 				//Document found, return delivery window
		// 				console.log(document);
		// 				console.log(document.zipcode + ',' + document.deliverytime + 'EST');
		// 			}
		// 			else
		// 			{
		// 				//Document not found, create it
		// 				console.log("Creating document");

		// 				//Generate the delivery time. Delivery time is in 24hr format. Minutes can be:
		// 				//:00
		// 				//:15
		// 				//:30
		// 				//:45
		// 				var deliverytimeHour = Math.floor(Math.random() * 24);
		// 				var deliverytimeMinutes = Math.floor(Math.random() * 3);
		// 				deliverytimeMinutes = deliverytimeMinutes * 15;
		// 				var deliveryTimeString = deliverytimeHour + ':' + deliverytimeMinutes;

		// 				var document = {
		// 					zipcode: req.params.zipcode, 
		// 					deliverytime: deliveryTimeString, 
		// 					deliveryHour: deliverytimeHour, 
		// 					deliveryMinutes: deliverytimeMinutes, 
		// 					createdDate: Date.now()
		// 				};

		// 				deliveryWindows_Collection.insert(document, function(err,result)
		// 				{
		// 					if(!err)
		// 					{
		// 						console.log("Created new zipcode entry.");
		// 						console.log(document);
		// 					}
		// 					else
		// 					{
		// 						console.log("Error inserting zipcode entry");
		// 						console.log(err);
		// 					}
		// 				});
		// 			}
		// 	});
			

		// }
	});

}