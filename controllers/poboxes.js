//Includes
var validator = require('validator');
var passwordHasher = require('password-hash-and-salt');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

//Static variables
var PO_BOX_NUMBER_LENGTH = 5;

module.exports = function(app,express,db)
{
    //Load the database collections
    var deliveryWindows_Collection;
    var poboxes_Collection;

	deliveryWindows_Collection = db.collection('deliveryWindows', function(err, collectionref) { 
	    if(!err)
	    {
	    	console.log("Connected to deliveryWindows collection");
	    }
	    else
	    {
	      	console.log("Could not connect to deliveryWindows collection");
	  		console.log(err);
	  		process.exit();	
	    }
	});
	poboxes_Collection = db.collection('poBoxes', function(err, collectionref) { 
	    if(!err)
	    {
	    	console.log("Connected to poBoxes collection");


			//Configure passport
			passport.use(new LocalStrategy(
				{
					usernameField: 'box_number',
					passwordField: 'password'
				},
			  function(username, password, done) {
			  	console.log(username + "," + password);
			  	poboxes_Collection.findOne({box_number: username}, function(err, pobox)
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




	    }
	    else
	    {
	      	console.log("Could not connect to poBoxes collection");
	  		console.log(err);
	  		process.exit();	
	    }
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
		collection = poboxes_Collection.find().sort({"box_number":-1}).toArray(function(err,result)
		{
			var ponumber = 0;
			if(result.length > 0)
			{
				ponumber = parseInt(result[0].box_number) + 1;
			}

			ponumber = intToPONumber(ponumber, PO_BOX_NUMBER_LENGTH);

			//Hash the password
			passwordHasher(password).hash(function(error,hash)
			{
				if(!error)
				{
					password = hash;

					//Insert record into database
					var user = {
						"first_name": first_name,
						"email": email,
						"zipcode": zipcode,
						"password": password,
						"box_number": ponumber
					};

					poboxes_Collection.insert(user, function(err,result)
					{
						if(!err)
						{
							res.setHeader('Content-Type','application/json');
							console.log(user);
							res.send(JSON.stringify(user));
						}
						else
						{
							console.log("Error inserting pobox entry");
							console.log(err);
						}
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

	// //Authenticates a PO Box.
	// //Parameters: 	box_number - The PO Box number
	// //				password   - The hashed password
	// //Returns: A token?
	app.post('/poboxes/authorizeBox', 
		passport.authenticate('local',{
			successRedirect: '/',
			faileRedirect: '/',
			failureFlash: false
		}),
		function(req, res, next)
		{
			//Gather post variables
			var box_number,
				password;

			box_number = req.body.box_number;
			password = req.body.password;

			//Sanatize strings
			box_number = validator.escape(box_number);

			res.setHeader('Content-Type','application/json');
			res.send(JSON.stringify('{"message":"okay"}'));


	});
	// As with any middleware it is quintessential to call next()
// if the user is authenticated
var isAuthenticated = function (req, res, next) {
	  if (req.isAuthenticated())
	    return next();
	  res.redirect('/');
	}
	//Function to test authorization
	app.get('/poboxes/testAuth',isAuthenticated,function(req,res)
	{
					res.setHeader('Content-Type','application/json');
			res.send(JSON.stringify('{"message":"You all good pony boy"}'));
	});
app.get('/signout', function(req, res) {
  req.logout();
  res.redirect('/');
});
	//Query database for zipcode, create if not exists.
	//Parameters: zipcode - The zipcode to check
	//Returns: String in format of HH:MM that marks 24h format for delivery time
	app.get('/poboxes/getDeliveryTime/:zipcode', function (req, res, next) {
		if(deliveryWindows_Collection)
		{
			//Search for the zipcode
			var document = deliveryWindows_Collection.findOne({zipcode: req.params.zipcode},function(err,document)
			{
					if(document)
					{
						//Document found, return delivery window
						console.log(document);
						console.log(document.zipcode + ',' + document.deliverytime + 'EST');
					}
					else
					{
						//Document not found, create it
						console.log("Creating document");

						//Generate the delivery time. Delivery time is in 24hr format. Minutes can be:
						//:00
						//:15
						//:30
						//:45
						var deliverytimeHour = Math.floor(Math.random() * 24);
						var deliverytimeMinutes = Math.floor(Math.random() * 3);
						deliverytimeMinutes = deliverytimeMinutes * 15;
						var deliveryTimeString = deliverytimeHour + ':' + deliverytimeMinutes;

						var document = {
							zipcode: req.params.zipcode, 
							deliverytime: deliveryTimeString, 
							deliveryHour: deliverytimeHour, 
							deliveryMinutes: deliverytimeMinutes, 
							createdDate: Date.now()
						};

						deliveryWindows_Collection.insert(document, function(err,result)
						{
							if(!err)
							{
								console.log("Created new zipcode entry.");
								console.log(document);
							}
							else
							{
								console.log("Error inserting zipcode entry");
								console.log(err);
							}
						});
					}
			});
			

		}
	});



	//
	// HELPER FUNCTIONS
	//

	//Converts the database integer to the 5 digit PO Number
	function intToPONumber(num, size) {
	    var s = num+"";
	    while (s.length < size) s = "0" + s;
	    return s;
	}

};