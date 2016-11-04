define(['knockout', 'jquery'], function(ko, $) {

    function Chat(authentication) {
        var self = this;

        self.authentication = authentication;

        self.messageToSend = ko.observable();
        self.messages = ko.observableArray();

        self.sendMessageToServer = function(userName, message) { return $.Deferred().resolve(); };

        self.sendMessage = function() {
            if (authentication.isLoggedIn() && self.messageToSend()) {
                self.sendMessageToServer(authentication.userName(), self.messageToSend())
                    .then(function() {
                        self.messageToSend(null);
                    });
            }
        };

        self.addMessage = function(userName, message) {
            self.messages.push({
                userName: userName,
                message: message
            });
        };
    }

    return Chat;
});
