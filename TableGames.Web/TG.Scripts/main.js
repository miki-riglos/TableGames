﻿require.config({
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

    var hub = $.connection.managerHub;

    var manager = new Manager(hub);

    $.connection.hub.start().then(function() {
        hub.server.getState().then(function(currentState) {
            manager.setState(currentState);
        });
    });

    ko.applyBindings(manager);
});
