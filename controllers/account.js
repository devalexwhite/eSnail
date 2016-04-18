module.exports = function(app,express,db)
{
	//Load the database collections
    var accounts_Collection;
	accounts_Collection = db.collection('accounts', function(err, collectionref) { 
	    if(!err)
	    {
	    	console.log("Connected to accounts collection");
	    }
	    else
	    {
	      	console.log("Could not connect to accounts collection");
	  		console.log(err);
	  		process.exit();	
	    }
	});

	app.post('/accounts/createAccount', function (req, res, next) {
		console.log("HERE");
		console.log(req.body.username);
	});
};