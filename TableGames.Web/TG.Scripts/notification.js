﻿define(['knockout'], function(ko) {

    function Notification(hub, authentication) {
        var self = this;

        self.isLoggedIn = authentication.isLoggedIn;
        self.message = ko.observable();

        self.messages = ko.observableArray();

        self.sendMessage = function() {
            hub.server.sendMessage(authentication.userName(), self.message());
        };

        hub.client.addMessage = function(userName, message) {
            self.messages.push({
                userName: userName,
                message: message
            });
        };
    }

    return Notification;
});
