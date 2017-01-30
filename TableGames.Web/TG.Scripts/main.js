require.config({
    paths: {
        'knockout': '../Scripts/knockout-3.4.0.debug',
        'text': '../Scripts/text',
        'ko-ext': './extensions/ko-extended',
        'game': './extensions/gameScriptLoader',
        'tmpl': './extensions/gameTemplateLoader'
    }
});

define('jquery', function() { return window.jQuery; });    // already loaded in _layout.cshtml

require(['ko-ext', 'jquery', 'manager'], function(ko, $, Manager) {

    var manager = Manager.instance;

    $.connection.hub.start().then(function() {
        manager.hub.server.getState().then(function(currentState) {
            ko.applyBindings(manager);
            manager.setState(currentState);
        });
    });
});
