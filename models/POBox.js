//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Moment JS and moment timezones
var moment = require('moment');
var momentTZ = require('moment-timezone');

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
	permissions: {type: [String], default: ["user"]},					//Permissions the box has
	timezone: {type: String},											//Timezone the user selected
	delivery_time_hour: {type: Number},									//The UTC hour for the delivery time
	delivery_time_minute: {type: Number},								//The UTC minutes for the delivery time
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

		var current_time_delivery_zone = moment().tz(box.timezone);

		if((current_time_delivery_zone.hour() > box.delivery_time_hour) || (current_time_delivery_zone.hour() == box.delivery_time_hour && current_time_delivery_zone.minutes() > box.delivery_time_minute))
		{
			current_time_delivery_zone.add(1,'d');
		}

		current_time_delivery_zone.hour(box.delivery_time_hour);
		current_time_delivery_zone.minute(box.delivery_time_minute);

		var timeDifference = moment.duration(current_time_delivery_zone.diff(moment().tz(box.timezone)));

		var diffHours = timeDifference.hours();
		var diffMinutes = timeDifference.minutes();

		var returnString = '';

		if(diffHours > 0)
		{
			returnString += diffHours + " hour";

			if(diffHours > 1)
			{
				returnString += 's';
			}
			
			returnString += " ";
		}

		if(diffMinutes > 0)
		{
			returnString += diffMinutes + " minute";

			if(diffMinutes > 1)
			{
				returnString += 's';
			}
		}

		callback(returnString);
	});
}

//Returns a JavaScript object of the next delivery time
poboxSchema.statics.nextDeliveryTimeObject = function(boxid, callback)
{
	POBox.findById(boxid, function(err,box)
	{
		var current_time_delivery_zone = moment().tz(box.timezone);

		if((current_time_delivery_zone.hour() > box.delivery_time_hour) || (current_time_delivery_zone.hour() == box.delivery_time_hour && current_time_delivery_zone.minutes() > box.delivery_time_minute))
		{
			current_time_delivery_zone = current_time_delivery_zone.add(1,'d');
		}

		current_time_delivery_zone = current_time_delivery_zone.hour(box.delivery_time_hour);
		current_time_delivery_zone = current_time_delivery_zone.minutes(box.delivery_time_minute);

		callback(current_time_delivery_zone);
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
			var friendly_box_number = helperFunctions.intToPONumber(box_number,5);

			callback({box_number: box_number, friendly_box_number: friendly_box_number});
		}
	});


};

//Create the model
var POBox = mongoose.model('POBox', poboxSchema);

//Export model so it can be used in our routes
module.exports = POBox;