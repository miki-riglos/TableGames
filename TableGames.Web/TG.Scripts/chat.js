define(['knockout', 'jquery', 'authentication', 'beeper'], function(ko, $, Authentication, Beeper) {

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

        self.beeper = new Beeper();

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
            if (authentication.userName() !== userName) {
                self.beeper.beep();
            }
        };
    }

    return Chat;
});
