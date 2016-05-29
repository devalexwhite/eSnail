$(document).ready(function()
{
	//Replace editables with text fields if we are in compose mode
	if(template_mode == 'compose')
	{
		//Itterate through all editables and make them editable
		$('.template_editable').attr('contenteditable','true');
	}
	//Otherwise, fill the fields with the given content
	else
	{	
		//Itterate through all editables
		$('.template_editable').each(function(editable)
		{
			//Grab their database name
			var fieldKey = this.getAttribute('match-name');
			//Grab the value passed from Node
			var matchValue = render_content[fieldKey];

			//Set the content
			this.textContent = matchValue;
		});
	}

	if(template_mode == 'pdf')
	{
		$("#template_wrapper").css("width", template_pdfmode_width);
		$("#template_wrapper").css("height",template_pdfmode_height);
	}

});