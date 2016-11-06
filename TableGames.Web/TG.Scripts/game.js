define(['knockout'], function(ko) {

    function Game(gameState, room) {
        var self = this;

        self.name = gameState.name;
        self.status = ko.observable(gameState.status);
        self.playerNames = ko.observableArray(gameState.playerNames);

        self.room = room;

        self.addPlayerName = function(playerName) {
            self.playerNames.push(playerName);
        };

        self.hasStarted = ko.computed(function() {
            return self.status() === 'Started';
        });
    }

    return Game;
});
