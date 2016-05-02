//Include the POBox model
var POBox = require('../models/POBox.js');


module.exports = function(app,express,db)
{
	app.get('/testing/createAccount', function(req,res,next)
	{
		var testDate = new Date("12:45");

		var testBox= new POBox({
			box_number: Math.floor(Math.random() * 5),
			first_name: "Tester",
			password: "a",
			zip_code: "43221",
			email: "devalexwhite@gmail.com",
			delivery_time: "12:45"
		});

		console.log("Going to create the following test: ");
		console.log(testBox);

		testBox.save(function(err)
		{
			if(err)
				throw err

			console.log("Created box");

			POBox.find({}, function(err, boxes)
			{
				if(err)
					throw err;
				console.log("Listing all boxes");
				console.log(boxes);
			});
		});

	});
}