define(['knockout', 'authentication', 'createGame'], function(ko, Authentication, createGame) {

    function Table(tableState, room) {
        var self = this;
        var authentication = Authentication.instance;

        self.gameName = tableState.gameName;
        self.status = ko.observable(tableState.status);
        self.playerNames = ko.observableArray(tableState.playerNames);

        self.room = room;

        self.game = ko.observable();

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

        self.start = function(tableStatus, gameConfig, gameState) {
            self.status(tableStatus);
            self.game(createGame(self.gameName, gameConfig, gameState, self, authentication.userName()))
        };
        self.canStart = ko.computed(function() { return self.room.isHost() && !self.hasStarted(); });
    }

    return Table;
});
