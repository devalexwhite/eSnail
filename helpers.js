//
// HELPER FUNCTIONS
//

//Statics Library
var StaticsLibrary = require('./static_data.js');


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
	res.render('./poboxes/login',{errorMessages: req.flash('error'),countries: StaticsLibrary.Countries});
}

module.exports = new helpers();