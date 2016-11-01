require.config({
    paths: {
        'knockout': '../Scripts/knockout-3.4.0.debug',
        'ko-ext': './extensions/ko-extended'
}
});

define('jquery', function() { return jQuery; });    // already loaded in _layout.cshtml

require(['ko-ext', 'jquery', 'notification', 'authentication', 'chat', 'manager'], function(ko, $, Notification, Authentication, Chat, Manager) {

    var hub = $.connection.tableGamesHub;

    var notification = new Notification();
    var authentication = new Authentication(hub, notification);
    var chat = new Chat(hub, authentication);
    var manager = new Manager(hub, notification, authentication);

    $.connection.hub.start().then(function() {
        hub.server.getState().then(function(currentState) {
            manager.initialize(currentState);
        });
    });

    ko.applyBindings(authentication, document.getElementById('tgAuthentication'));
    ko.applyBindings(chat, document.getElementById('tgChat'));
    ko.applyBindings(manager, document.getElementById('tgContainer'));
});
