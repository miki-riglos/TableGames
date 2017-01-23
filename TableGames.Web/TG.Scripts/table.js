define(['knockout', 'jquery', 'authentication', 'gameProvider'], function(ko, $, Authentication, gameProvider) {

    function Table(tableState, room) {
        var self = this;
        var authentication = Authentication.instance;
        var gamePromise = $.when();

        self.gameName = tableState.gameName;
        self.status = ko.observable(tableState.status);
        self.playerNames = ko.observableArray(tableState.playerNames);
        self.activePlayerName = ko.observable(tableState.activePlayerName);

        self.statsTemplateName = ko.observable('statsVerticalTemplate');
        self.stats = ko.observableArray(tableState.stats);
        self.winnerNames = ko.observableArray(tableState.winnerNames);

        self.room = room;

        self.gameTemplateName = ko.observable();
        self.game = ko.observable();

        self.isStarted = ko.computed(function() {
            return self.status() === 'Started';
        });

        self.addPlayerName = function(playerName) {
            self.playerNames.push(playerName);
        };
        self.removePlayerName = function(playerName) {
            self.playerNames.remove(playerName);
        };

        self.hasJoined = ko.computed(function() { return self.playerNames.contains(authentication.userName()); });

        self.canJoin = ko.computed(function() { return authentication.isLoggedIn() && !self.isStarted() && !self.hasJoined(); });
        self.canLeave = ko.computed(function() { return authentication.isLoggedIn() && !self.isStarted() && self.hasJoined(); });

        self.start = function(tableState, gameConfig) {
            self.status(tableState.status);
            self.winnerNames.removeAll();
            self.startGame(tableState, gameConfig);
        };
        self.canStart = ko.computed(function() { return self.room.isHost() && !self.isStarted(); });

        self.changeGame = function(playerName, actionName, gameChangeResults) {
            gamePromise = gamePromise.then(function() {
                self.game().change(playerName, actionName, gameChangeResults);
            });
        };

        self.startGame = function(tableState, gameConfig) {
            gamePromise = gamePromise
                            .then(function() {
                                return self.game() && self.game().initPromise;  // make sure current game initialized before creating next one
                            })
                            .then(function() {
                                self.game(null);    // avoid game/template mismatch
                                return gameProvider.createGame(tableState.instanceGameName, gameConfig, tableState.game);
                            })
                            .then(function(game) {
                                self.game(game);
                                return game.initPromise;
                            })
                            .then(function() {
                                self.stats(tableState.stats);   // update stats after new game is initialized
                            });
        };
        self.canRestartGame = ko.computed(function() { return self.room.isHost() && self.isStarted() && self.game() && self.game().isEnded(); });

        // user game
        self.setUserGame = function(userGameState) {
            gamePromise = gamePromise.then(function() {
                self.game().setUserGame(userGameState);
            });
        };

        self.changeUserGame = function(actionName, userGameChangeResults) {
            gamePromise = gamePromise.then(function() {
                self.game().changeUserGame(actionName, userGameChangeResults);
            });
        };

        self.isUserTurn = ko.computed(function() {
            return self.activePlayerName() === authentication.userName() && self.game() && !self.game().isEnded();
        });
    }

    return Table;
});
