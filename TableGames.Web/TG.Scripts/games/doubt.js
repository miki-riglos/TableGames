define(['knockout'], function(ko) {

    function Doubt(gameConfig, gameState, table) {
        var self = this;

        self.quantity = ko.observable(gameState.quantity);
        self.dice = new Dice(gameState.dice);

        self.playerCups = gameState.playerCups.map(function(playerCupState) { return new PlayerCup(playerCupState); });
        self.playerCups.update = function(playerCupsState) {
            playerCupsState.forEach(function(playerCupState, index) {
                self.playerCups[index].updateDices(playerCupState.dices);
            });
        };

        table.activePlayerName(gameState.table.activePlayerName);

        // user game
        self.userGame = ko.observable();

        // set user game state
        self.setUserGame = function(userGameState) {
            self.userGame({
                dices: userGameState.dices.map(function(diceState) { return new Dice(diceState); })
            });
        };

        // change user game state
        self.changeUserGame = function(actionName, userGameChangeResults) {
            userGameChangeResults.dices.forEach(function(diceState, index) {
                self.userGame().dices()[index].isExposed(diceState.isExposed);
                self.userGame().dices()[index].value(diceState.value);
            });
        };

        // stats template
        table.statsTemplateName('doubtStatsTemplate');
    }

    Doubt.ActionConstructors = [
        function BetAction(gameConfig, game, table) {
            var self = this;
            self.name = 'bet';

            // quantity
            self.quantity = ko.observable(1);
            self.quantity.dial = {
                up: function() {
                    self.quantity(self.quantity() + 1);
                },
                down: function() {
                    if (self.quantity() > 1) {
                        self.quantity(self.quantity() - 1);
                    }
                }
            };

            // dice
            self.dice = new Dice({ value: 1 });
            self.dice.dial = {
                up: function() {
                    if (self.dice.value() < 6) {
                        self.dice.value(self.dice.value() + 1);
                    }
                },
                down: function() {
                    if (self.dice.value() > 1) {
                        self.dice.value(self.dice.value() - 1);
                    }
                }
            };

            // rethrow other dices
            self.rethrowOthers = ko.observable(false);

            self.getParameters = function() {
                return {
                    quantity: self.quantity(),
                    diceValue: self.dice.value(),
                    rethrowOthers: self.rethrowOthers()
                };
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                game.quantity(gameChangeResults.quantity);
                game.dice.value(gameChangeResults.dice.value);
                game.playerCups.update(gameChangeResults.playerCups);
                table.activePlayerName(gameChangeResults.table.activePlayerName);
            };
        },
        function DoubtAction(gameConfig, game, table) {
            var self = this;
            self.name = 'doubt';

            self.onExecuted = function(playerName, gameChangeResults) {
                game.playerCups.update(gameChangeResults.playerCups);
                game.isFinalized(gameChangeResults.isFinalized);
                table.stats(gameChangeResults.table.stats);
            };
        },
        function MatchAction(gameConfig, game, table) {
            var self = this;
            self.name = 'match';

            self.onExecuted = function(playerName, gameChangeResults) {
                game.playerCups.update(gameChangeResults.playerCups);
                game.isFinalized(gameChangeResults.isFinalized);
                table.stats(gameChangeResults.table.stats);
            };
        }
    ];

    function PlayerCup(playerCupState) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = playerCupState.dices.map(function(diceState) { return new Dice(diceState); });

        self.updateDices = function(dicesState) {
            dicesState.forEach(function(diceState, index) {
                self.dices[index].value(diceState.value);
                self.dices[index].isExposed(diceState.isExposed);
            });
        };
    }

    function Dice(diceState) {
        var self = this;
        self.isExposed = ko.observable(diceState.isExposed);
        self.value = ko.observable(diceState.value);
    }

    return Doubt;
});
