$(document).ready(function()
{
    //Setup select2 for ajax loading of PO boxes
    $("#recipient_search").select2({

        minimumInputLength: 2,
        minimumResultsForSearch: 10,
        ajax: {
            url: '/poboxes/searchBoxes',
            dataType: "json",
            type: "GET",
            data: function (params) {

                var queryParameters = {
                    q: params.term
                }
                return queryParameters;
            },
            processResults: function (data) {
                return {
                    results: $.map(data, function (item) {
                        return {
                            text: '#' + item.box_number + ', ' + item.first_name,
                            id: item.id,
                        }
                    })
                };
            }
        }
    });
    //Setup the compose submit button
    $("#compose_submit").click(function()
    {
        //Gather all the template's inputs
        var editableInputs = $('.template_editable');

        //Build array of values to send to server
        var valuesToSend = [];

        for (var i = editableInputs.length - 1; i >= 0; i--) {
            valuesToSend.push({'key': editableInputs[i].attributes['match-name'].value,'value':editableInputs[i].innerText});
        }

        var recipient_box_number = $("#recipient_search").val();

        if(!recipient_box_number)
        {
            alertSystem.displayAlert("You must select someone to send the message to!");
        }

        var postPackage  = {
                'template_id': template_id,
                'recipient_box_number': recipient_box_number,
                'template_values': valuesToSend
            };

        // postPackage = JSON.stringify(postPackage);

        $.ajax({
            type: 'POST',
            url: '/poboxes/compose',
            data: postPackage,
            success: function(data)
            {
                window.location='/poboxes/sent/' + data;
            }
        });
    });
});
