define(['knockout'], function(ko) {

    function Authentication() {
        var self = this;

        self.userName = ko.observable();
        self.isLoggedIn = ko.observable(false);
    }

    return Authentication;
});
