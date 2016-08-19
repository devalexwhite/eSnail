//Staticss
var MONGO_URI = "URL";

//Configure express for route handling, and set the secret key
var express = require('express');
var expressSession = require('express-session');
var app = express();
app.use(expressSession({secret: 'mySecretKey'}));

//Configure passport for authentication, and the password hasher
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var passwordHasher = require('password-hash-and-salt');

//Setup flash for displaying messages
var flash = require('connect-flash');
app.use(flash());
app.use(requireHTTPS);

//Filesystem
var fs = require('fs');

//Make moment available to Jade
app.locals.moment = require('moment');

//Configure body parser for post variables
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
})); 

//Now iniatlize passport with bodyparser
app.use(passport.initialize());
app.use(passport.session());
app.use(require('body-parser').urlencoded());       

//Configure the pug template engine
app.set('views', 'views');
app.set('view engine', 'pug');

//Setup mongoose
var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/esnail');
mongoose.connect(MONGO_URI);
var db = mongoose.connection;

//Database error callback
db.on('error', console.error.bind(console,'connection error: '));

//Database connect callback
db.once('open',function(err, db) {
    //Load the controllers
	var controllers = [
		"messaging",
		"poboxes",
		"templates",
		"application",
		"beta"
	];

	//Require each controller
	for (var i = controllers.length - 1; i >= 0; i--) {
		require('./controllers/' + controllers[i] + '.js')(app,express,db);
	}

	//Configure express server
	app.use(express.static('www'));
	var http = require('http'); 
	var https = require('https'); 


	var credentials = {
	    key: fs.readFileSync("./ssl/esnail_io.key", 'utf8'), //SSL key
	    cert: fs.readFileSync("./ssl/esnail_io.crt", 'utf8') //the certificate
	};
	var server = app.listen((process.env.port || 80), function() {
	    var host = server.address().address;
	    var port = server.address().port;
	    
	    console.log("Server running at http://%s:%s",host,port);
	});

	var httpsServer = https.createServer(credentials,app);
	httpsServer.listen(443);
	console.log("Server running at https://%s:%s");

  });

//This function will force HTTPS
function requireHTTPS(req, res, next)
{
	if(!req.secure)
	{
		return res.redirect('https://' + req.get('host') + req.url);
	}

	next();
}
