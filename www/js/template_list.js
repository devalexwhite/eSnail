$(document).ready(function()
{
	//Setup template list binding
	$('.template_object').click(function()
	{
		$('.template_object').removeClass('selected');

		$(this).addClass('selected');
	});
});
