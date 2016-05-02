//
// HELPER FUNCTIONS
//
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
  res.redirect('/');
}

//Returns the number of ms until the message with specified ID is unlocked.
//If zero is returned, the message is already unlocked
helpers.prototype.messageUnlockStatus = 

module.exports = new helpers();