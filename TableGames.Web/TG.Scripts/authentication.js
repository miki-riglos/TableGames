define(['knockout'], function(ko) {

    function Authentication(hub, notification) {
        var self = this;

        self.userName = ko.observable();
        self.isLoggedIn = ko.observable(false);

        self.toggleLogin = function() {
            if (!self.isLoggedIn()) {
                if (self.userName()) {
                    hub.server.login(self.userName())
                        .then(function() {
                            self.isLoggedIn(true);
                            self.toggleLogin.label('Logout');
                        })
                        .catch(function(err) {
                            notification.addError(err.message);
                        });
                }
            } else {
                hub.server.logout(self.userName())
                    .then(function() {
                        self.isLoggedIn(false);
                        self.toggleLogin.label('Login');
                    })
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };
        self.toggleLogin.label = ko.observable('Login');
    }

    return Authentication;
});
