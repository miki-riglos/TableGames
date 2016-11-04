define(['knockout'], function(ko) {

    function Game(gameState) {
        var self = this;

        self.name = gameState.name;
        self.status = ko.observable(gameState.status);
        self.playerNames = ko.observableArray(gameState.playerNames);

        self.addPlayerName = function(playerName) {
            self.playerNames.push(playerName);
        };
    }

    return Game;
});
