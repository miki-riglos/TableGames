define(['knockout'], function(ko) {

    function Chat() {
        var self = this;

        self.messageToSend = ko.observable();
        self.messages = ko.observableArray();

        self.addMessage = function(userName, message) {
            self.messages.push({
                userName: userName,
                message: message
            });
        };
    }

    return Chat;
});
