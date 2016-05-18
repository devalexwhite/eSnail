var alertSystem = function() {
	function displayAlert(message)
	{
		clearAlerts();
		$("#page_notification_center").append("<div class='alert alert-danger' role='alert'>" + message + "</div>");
	}
	function clearAlerts()
	{
		$("#page_notification_center").html('');
	}
	return {
		displayAlert: displayAlert,
		clearAlerts: clearAlerts
	};
}();