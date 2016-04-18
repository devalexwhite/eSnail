module.exports = function(app,express,db)
{
    //Load the database collections
    var deliveryWindows_Collection;
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

	//Query database for zipcode, create if not exists
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

};