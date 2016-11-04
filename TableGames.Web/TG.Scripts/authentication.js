define(['knockout'], function(ko) {

    function Authentication() {
        var self = this;

        self.nameToLogin = ko.observable();
        self.isLoggedIn = ko.observable(false);
        self.userName = ko.observable();

        self.login = function() {
            self.isLoggedIn(true);
            self.userName(self.nameToLogin());
        };

        self.logout = function() {
            self.isLoggedIn(false);
            self.userName(null);
            self.nameToLogin(null);
        };
    }

    return Authentication;
});
