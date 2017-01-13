define(['knockout'], function(ko) {

    function Beeper(duration) {
        var self = this;
        var timeoutId;

        duration = duration || 2000;

        self.isBeeping = ko.observable(false);

        self.beep = function() {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }

            self.isBeeping(true);

            timeoutId = window.setTimeout(function() {
                if (self) {
                    self.isBeeping(false);
                }
                timeoutId = undefined;
            }, duration);
        };
    }

    return Beeper;
});
