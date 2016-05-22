$(document).ready(function()
{
	$(window).bind('beforeunload', function(){
		return 'Did you like this message? If so, download the PDF! The message will be deleted as soon as you navigate away.';
	});
});