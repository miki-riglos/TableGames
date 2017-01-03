define(['knockout', 'jquery', 'authentication', 'gameProvider'], function(ko, $, Authentication, gameProvider) {

    function Table(tableState, room) {
        var self = this;
        var authentication = Authentication.instance;
        var gamePromise = $.Deferred().resolve();

        self.gameName = tableState.gameName;
        self.status = ko.observable(tableState.status);
        self.playerNames = ko.observableArray(tableState.playerNames);
        self.activePlayerName = ko.observable(tableState.activePlayerName);

        self.statsTemplateName = ko.observable('statsVerticalTemplate');
        self.stats = ko.observableArray(tableState.stats);

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

        self.start = function(tableState, gameConfig) {
            self.status(tableState.status);
            self.startGame(tableState, gameConfig);
        };
        self.canStart = ko.computed(function() { return self.room.isHost() && !self.hasStarted(); });

        self.changeGame = function(playerName, actionName, gameChangeResults) {
            gamePromise = gamePromise.then(function() {
                if (!self) return;  // in case table was destroyed before game change
                self.game().change(playerName, actionName, gameChangeResults);
            });
        };

        self.startGame = function(tableState, gameConfig) {
            self.stats(tableState.stats);
            gamePromise = gamePromise
                            .then(function() {
                                return gameProvider.createGame(self.gameName, gameConfig, tableState.game);
                            })
                            .then(function(game) {
                                self.game(game);
                            });
        };
        self.canRestartGame = ko.computed(function() { return self.room.isHost() && self.hasStarted() && self.game() && self.game().isFinalized(); });

        // user game
        self.setUserGame = function(userGameState) {
            gamePromise = gamePromise.then(function() {
                if (!self) return;  // in case table was destroyed before game change
                self.game().setUserGame(userGameState);
            });
        };

        self.changeUserGame = function(actionName, userGameChangeResults) {
            gamePromise = gamePromise.then(function() {
                if (!self) return;  // in case table was destroyed before game change
                self.game().changeUserGame(actionName, userGameChangeResults);
            });
        };

        self.isUserTurn = ko.computed(function() {
            return self.activePlayerName() === authentication.userName() && self.game() && !self.game().isFinalized();
        });
    }

    return Table;
});
