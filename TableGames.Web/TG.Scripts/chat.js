define(['knockout'], function(ko) {

    function Chat(hub, authentication) {
        var self = this;

        self.isLoggedIn = authentication.isLoggedIn;
        self.messageToSend = ko.observable();

        self.messages = ko.observableArray();

        self.sendMessage = function() {
            if (self.messageToSend()) {
                hub.server.sendMessage(authentication.userName(), self.messageToSend());
                self.messageToSend(null);
            }
        };

        hub.client.onMessageSent = function(userName, message) {
            self.messages.push({
                userName: userName,
                message: message
            });
        };
    }

    return Chat;
});
