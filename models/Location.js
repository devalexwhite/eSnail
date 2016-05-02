//Include mongoose and schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup the Location data schema
var locationSchema = new Schema({
	zip_code: {type:String, required: true},
	delivery_time: {type:String, required: true}
},
{
	timestamps: true													//Mongoose will automatically add createdAt and updatedAt
});

//Create the model
var Location = mongoose.model('Location', locationSchema);

//Export model so it can be used in our routes
module.exports = Location;