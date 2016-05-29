//Statics Library
var StaticsLibrary = require('../static_data.js');

module.exports = function(app,express,db)
{
	//Main routes
	app.get('/', function(req,res)
	{
		res.render('index',{
			user: req.user, 
			errorMessages: req.flash('error'),
			timezones: StaticsLibrary.Timezones
		});
	});
}