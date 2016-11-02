define(['knockout'], function(ko) {

    function Authentication() {
        var self = this;

        self.nameToLogin = ko.observable();
        self.isLoggedIn = ko.observable(false);
        self.userName = ko.observable();
    }

    return Authentication;
});
