define(['knockout'], function(ko) {

    function Notification(classNames) {
        var self = this;

        self.classNames = classNames || 'tg-notification';
        self.alerts = ko.observableArray();

        self.addInfo = function(message) {
            var alert = {
                type: 'info',
                message: message
            };
            self.alerts.push(alert);
            setTimeout(function() { self.removeAlert(alert); }, 5000);
        };

        self.addError = function(message) {
            self.alerts.push({
                type: 'error',
                message: message
            });
        };

        self.removeAlert = function(alert) {
            self.alerts.remove(alert);
        };

        self.clearAlerts = function() {
            self.alerts.removeAll();
        };
    }

    Notification.instance = new Notification();

    return Notification;
});
