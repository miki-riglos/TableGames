define(['knockout'], function(ko) {

    function Authentication(hub) {
        var self = this;

        self.userName = ko.observable();
        self.isLoggedIn = ko.observable(false);

        self.toggleLogin = function() {
            if (!self.isLoggedIn()) {
                if (self.userName()) {
                    self.isLoggedIn(true);
                    self.toggleLogin.label('Logout');
                }
            } else {
                self.isLoggedIn(false);
                self.toggleLogin.label('Login');
            }
        };
        self.toggleLogin.label = ko.observable('Login');
    }

    return Authentication;
});
