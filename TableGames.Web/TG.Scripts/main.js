require.config({
    paths: {
        'knockout': '../Scripts/knockout-3.4.0.debug'
    }
});

define('jquery', function() { return jQuery; });    // already loaded in _layout.cshtml

require(['knockout', 'jquery', 'authentication', 'notification'], function(ko, $, Authentication, Notification) {

    var hub = $.connection.tableGamesHub;

    var authentication = new Authentication(hub);
    var notification = new Notification(hub, authentication);
    var state = {
        messages: ko.observableArray()
    };

    $.connection.hub.start();

    ko.applyBindings(authentication, document.getElementById('tgAuthentication'));
    ko.applyBindings(notification, document.getElementById('tgNotification'));
    ko.applyBindings(state, document.getElementById('tgContainer'));
});
