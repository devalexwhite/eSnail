$(document).ready(function()
{
	//Enable select2
	$('#recipient_search').select2({
    minimumInputLength: 2,
    tags: [],
    ajax: {
        url: '/poboxes/searchBoxes',
        dataType: 'json',
        type: "GET",
        quietMillis: 50,
        data: function (term) {
            return {
                q: term
            };
        },
        results: function (data) {
            console.log(data);
        }
    }
});
});
