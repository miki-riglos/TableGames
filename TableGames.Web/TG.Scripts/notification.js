define(['knockout'], function(ko) {

    function Notification() {
        var self = this;

        self.messages = ko.observableArray();

        self.addInfo = function(message) {
            self.messages.push({
                type: 'info',
                message: message
            });
        };

        self.addError = function(message) {
            self.messages.push({
                type: 'error',
                message: message
            });
        };
    }

    return Notification;
});
