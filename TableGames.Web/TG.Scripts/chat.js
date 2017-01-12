define(['knockout', 'jquery', 'authentication'], function(ko, $, Authentication) {

    var counter = 0;

    function getClientId() {
        counter++;
        return 'chat' + counter;
    }

    function Chat(config) {
        var self = this;
        var authentication = Authentication.instance;
        self.authentication = authentication;

        self.clientId = getClientId();

        self.messageToSend = ko.observable();
        self.messages = ko.observableArray();

        self.sendMessage = function() {
            if (authentication.isLoggedIn() && self.messageToSend()) {
                config.sendMessageToServer(authentication.userName(), self.messageToSend())
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
