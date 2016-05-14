//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Moment JS
var moment = require('moment');

//Location model
var Location = require('../models/Location.js');

//Misc functions
var helperFunctions = require('../helpers.js');

//Setup the POBox data schema
var poboxSchema = new Schema({
	box_number: {type: Number, required: true, unique: true},			//The unique PO Box number generated at account creation
	friendly_box_number: {type: String, required: true},				//The user facing box number
	country: {type: String},											//2 letter country code
	first_name: {type: String, required: true},							//User's first name
	password: {type: String, required: true},							//Hash of user's password
	email: {type: String},												//User's email used for notifications and recovery
	last_access: {type: Date},											//Time of last account access
	messages: {type: [Schema.ObjectId], ref: 'Message'},				//All messages associated with this account
	location: {type: Schema.ObjectId, ref: 'Location'},					//Associated Location object holding the zip code and delivery time
	permissions: {type: [String], default: ["user"]}
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Check if the pobox has a specified permission
poboxSchema.statics.boxHasPermission = function(boxid,permission,callback)
{
	POBox.findById(boxid, function(err,result)
	{
		if(err)
			throw err;
		if(!result)
			callback(false);

		if(result.permissions.indexOf(permission) > -1)
		{
			callback(true);
		}
		else
		{
			callback(false);
		}
	});
}

//Get the minutes until the next delivery
poboxSchema.statics.timeStringUntilDelivery = function(boxid, callback)
{
	POBox.findById(boxid, function(err,box)
	{
		if(err)
			throw err;

		Location.findById(box.location, function(err,location)
		{
			if(err)
				throw err;

			var date = new Date();
			var current_hour = date.getUTCHours();
			var current_minutes = date.getUTCMinutes();
			var current_total_minutes = (60 * current_hour) + current_minutes;

			var location_hour = location.delivery_time_hour;
			var location_minutes = location.delivery_time_minute;
			var location_total_minutes = (60 * location_hour) + location_minutes;

			var total_minutes_to_delivery = 0;

			if(current_total_minutes <= location_total_minutes)
			{
				total_minutes_to_delivery = location_total_minutes - current_total_minutes;
			}
			else
			{
				total_minutes_to_delivery = (1440 - (current_total_minutes - location_total_minutes));
			}

			var hours_to_delivery = Math.floor(total_minutes_to_delivery / 60);
			var minutes_to_delivery = total_minutes_to_delivery % 60;

			var returnString = '';

			if(hours_to_delivery > 0)
			{
				returnString += hours_to_delivery + ' hour';

				if(hours_to_delivery > 1)
					returnString += 's';

				if(minutes_to_delivery > 0)
				{
					returnString += ' and ' + minutes_to_delivery + ' minute';

					if(minutes_to_delivery > 1)
						returnString += 's';
				}
			}
			else if(minutes_to_delivery > 0)
			{
				returnString += minutes_to_delivery + ' minute';

				if(minutes_to_delivery > 1)
					returnString += 's';
			}

			callback(returnString);
		});
	});
}

//Function that creates the random PO Box number
poboxSchema.statics.randomBoxNumber = function(callback)
{
	//Generate the number
	var box_number = Math.floor(Math.random() * 99999) + 1;

	//Check if it already exists
	POBox.find({box_number: box_number}, function(err,result)
	{
		if(err)
			throw err;

		if(result.length > 0)
		{
			POBox.randomBoxNumber(callback);
		}
		else
		{
			var friendly_box_number = helperFunctions.intToPONumber(box_number);

			callback({box_number: box_number, friendly_box_number: friendly_box_number});
		}
	});


};

//Create the model
var POBox = mongoose.model('POBox', poboxSchema);

//Export model so it can be used in our routes
module.exports = POBox;