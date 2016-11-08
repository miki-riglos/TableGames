define(['knockout', 'authentication'], function(ko, Authentication) {

    function Game(gameState, room) {
        var self = this;
        var authentication = Authentication.instance;

        self.name = gameState.name;
        self.status = ko.observable(gameState.status);
        self.playerNames = ko.observableArray(gameState.playerNames);

        self.room = room;

        self.hasStarted = ko.computed(function() {
            return self.status() === 'Started';
        });

        self.addPlayerName = function(playerName) {
            self.playerNames.push(playerName);
        };
        self.removePlayerName = function(playerName) {
            self.playerNames.remove(playerName);
        };

        self.hasJoined = ko.computed(function() { return self.playerNames.contains(authentication.userName()); });

        self.canJoin = ko.computed(function() { return authentication.isLoggedIn() && !self.hasStarted() && !self.hasJoined(); });
        self.canLeave = ko.computed(function() { return authentication.isLoggedIn() && !self.hasStarted() && self.hasJoined(); });

        self.canStart = ko.computed(function() { return self.room.isHost() && !self.hasStarted(); });
    }

    return Game;
});
