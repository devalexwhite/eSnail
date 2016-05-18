$(document).ready(function()
{
	//Setup template list binding
	$('.template_object').click(function()
	{
		$('.template_object').removeClass('selected');

		$(this).addClass('selected');
	});
	//Setup the action button binding
	$('#select_template').click(function()
	{
		var selected = $('.selected');
		console.log(selected);
		if(selected.length <= 0)
		{
			alertSystem.displayAlert("You must select a template!");
		}
		else if(selected.length > 1)
		{
			alertSystem.displayAlert("Wait...hey, stay out of the HTML!");
		}
		else
		{
			var templateID = selected[0].attributes["template-id"].value;
			
			window.location = '/poboxes/compose?template_id=' + templateID;
		}
	});
});
