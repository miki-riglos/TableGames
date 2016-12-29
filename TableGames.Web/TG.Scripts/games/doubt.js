define(['knockout'], function(ko) {

    function Doubt(gameConfig, gameState) {
        var self = this;
        var table = gameConfig.table;
        var authentication = gameConfig.authentication;

        self.quantity = ko.observable(gameState.quantity);
        self.dice = new Dice(gameState.dice);

        self.playerCups = gameState.playerCups.map(function(playerCupState) { return new PlayerCup(playerCupState); });

        table.activePlayerName(gameState.table.activePlayerName);

        // actions
        self.actions = [
            new BetAction(self, gameConfig)
        ];

        // user game
        self.userGame = ko.observable();

        // set user game state
        self.setUserGame = function(userGameState) {
            self.userGame({
                dices: ko.observableArray(userGameState.dices.map(function(diceState) { return new Dice(diceState); }))
            });
        };

        // change user game state
        self.changeUserGame = function(eventName, userGameChangeResults) {
            userGameChangeResults.dices.forEach(function(diceState, index) {
                self.userGame().dices()[index].isExposed(diceState.isExposed);
                self.userGame().dices()[index].value(diceState.value);
            });
        };
    }

    function PlayerCup(playerCupState) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = playerCupState.dices.map(function(diceState) { return new Dice(diceState); });
    }

    function Dice(diceState) {
        var self = this;
        self.isExposed = ko.observable(diceState.isExposed);
        self.value = ko.observable(diceState.value);
    }

    function BetAction(doubt, gameConfig) {
        var self = this;
        var table = gameConfig.table;
        var authentication = gameConfig.authentication;

        self.eventName = 'bet';

        // quantity
        self.quantity = ko.observable(1);
        self.quantity.dial = {
            up: function() { self.quantity(self.quantity() + 1); },
            down: function() { self.quantity(self.quantity() - 1); }
        };

        // dice
        self.dice = new Dice({ value: 1 });
        self.dice.dial = {
            up: function() { self.dice.value(self.dice.value() + 1); },
            down: function() { self.dice.value(self.dice.value() - 1); }
        };

        self.execute = function(row, col) {
            if (table.activePlayerName() === authentication.userName() && !doubt.isFinalized()) {
                var gameChangeParameters = {
                    quantity: self.quantity(),
                    diceValue: self.dice.value()
                };
                gameConfig.sendChangeToServer(self.eventName, gameChangeParameters);
            }
        };

        self.onExecuted = function(playerName, gameChangeResults) {
            doubt.quantity(gameChangeResults.quantity);
            doubt.dice.value(gameChangeResults.dice.value);
            table.activePlayerName(gameChangeResults.table.activePlayerName);
        };
    }

    return Doubt;
});
