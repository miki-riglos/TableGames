define(['knockout', 'authentication', 'gameProvider'], function(ko, Authentication, gameProvider) {

    function Table(tableState, room) {
        var self = this;
        var authentication = Authentication.instance;
        var gamePromise;

        self.gameName = tableState.gameName;
        self.status = ko.observable(tableState.status);
        self.playerNames = ko.observableArray(tableState.playerNames);
        self.activePlayerName = ko.observable(tableState.activePlayerName);

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
            gamePromise = gameProvider.createGame(self.gameName, gameConfig, gameState)
                            .then(function(game) {
                                self.game(game);
                            });
        };
        self.canStart = ko.computed(function() { return self.room.isHost() && !self.hasStarted(); });

        self.changeGame = function(playerName, eventName, gameChangeResults) {
            gamePromise = gamePromise.then(function() {
                if (!self) return;  // in case table was destroyed before game change
                self.game().change(playerName, eventName, gameChangeResults);
            });
        };
    }

    return Table;
});
