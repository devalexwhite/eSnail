module.exports = function(app,express,db)
{
	//Main routes
	app.get('/', function(req,res)
	{
		res.render('index');
	});


	//Account routes
	app.get('/pobox/:page', function(req,res)
	{
		res.render(req.params.page);
	});
}