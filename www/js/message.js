$(document).ready(function()
{
	$(window).bind('beforeunload', function(){
		return 'Did you like this message? If so, download the PDF! The message will be deleted as soon as you navigate away.';
	});

	$('#save_pdf').click(function(){
		var doc = new jsPDF();
		var specialElementHandlers = {
		    '#editor': function (element, renderer) {
		        return true;
		    }
		};

	    doc.fromHTML($('#message_render').html(), 15, 15, {
	        'width': 170,
	            'elementHandlers': specialElementHandlers
	    });
	    doc.save('esnail_message.pdf');
	});
});