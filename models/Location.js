//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the Location data schema
var locationSchema = new Schema({
	zip_code: {type:String, required: true},							//Location's zip code
	delivery_time: {type:String, required: false}						//Location's delivery time
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Gets a Location given a zip code, creates a new Location if one doesn't exist
//Parameters: zip_code - The zipcode to check
//Returns: Location object
locationSchema.statics.getDeliveryTimeByZip = function(zip_code, callback)
{
	//See if the location is already here
	Location.findOne({zip_code: zip_code}).exec(function(err, result)
	{
		if(err)
			throw err;
		if(result)
		{
			//Location already exists, send to the callback
			callback(result);
		}
		else
		{
			//Generate the delivery time. Delivery time is in 24hr format. Minutes can be:
			//:00
			//:15
			//:30
			//:45
			var deliverytimeHour = Math.floor(Math.random() * 24);
			var deliverytimeMinutes = Math.floor(Math.random() * 3);
			deliverytimeMinutes = deliverytimeMinutes * 15;
			var deliveryTimeString = deliverytimeHour + ':' + deliverytimeMinutes;

			//Create a new location and save to database
			var newLocation = Location(
			{
				'zip_code': zip_code,
				'delivery_time': deliveryTimeString
			});

			newLocation.save(function(err)
			{
				if(err)
					throw err;

				//Send the new lcoation to the callback
				callback(newLocation);
			});
		}
	});	
};



//Create the model
var Location = mongoose.model('Location', locationSchema);

//Export model so it can be used in our routes
module.exports = Location;