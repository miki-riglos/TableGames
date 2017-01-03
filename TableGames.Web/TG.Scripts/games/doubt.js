﻿define(['knockout'], function(ko) {

    function Doubt(gameConfig, gameState, table) {
        var self = this;

        self.quantity = ko.observable(gameState.quantity);
        self.dice = new Dice(gameState.dice);
        self.actualQuantity = ko.observable(gameState.actualQuantity);

        self.playerCups = gameState.playerCups.map(function(playerCupState) { return new PlayerCup(playerCupState, self); });
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
                self.userGame().dices[index].isExposed(diceState.isExposed);
                self.userGame().dices[index].value(diceState.value);
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
                up: {
                    execute: function() {
                        self.quantity(self.quantity() + 1);
                    },
                    enable: table.isUserTurn
                },
                down: {
                    execute: function() {
                        if (self.quantity() > 1) {
                            self.quantity(self.quantity() - 1);
                        }
                    },
                    enable: table.isUserTurn
                }
            };

            // dice
            self.dice = new Dice({ isExposed: true, value: 1 });
            self.dice.dial = {
                up: {
                    execute: function() {
                        if (self.dice.value() < 6) {
                            self.dice.value(self.dice.value() + 1);
                        }
                    },
                    enable: table.isUserTurn
                },
                down: {
                    execute: function() {
                        if (self.dice.value() > 1) {
                            self.dice.value(self.dice.value() - 1);
                        }
                    },
                    enable: table.isUserTurn
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
                game.actualQuantity(gameChangeResults.actualQuantity);
                game.playerCups.update(gameChangeResults.playerCups);
                game.isFinalized(gameChangeResults.isFinalized);
                table.stats(gameChangeResults.table.stats);
            };
        },
        function MatchAction(gameConfig, game, table) {
            var self = this;
            self.name = 'match';

            self.onExecuted = function(playerName, gameChangeResults) {
                game.actualQuantity(gameChangeResults.actualQuantity);
                game.playerCups.update(gameChangeResults.playerCups);
                game.isFinalized(gameChangeResults.isFinalized);
                table.stats(gameChangeResults.table.stats);
            };
        }
    ];

    function PlayerCup(playerCupState, doubt) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = playerCupState.dices.map(function(diceState) { return new Dice(diceState, doubt); });

        self.updateDices = function(dicesState) {
            dicesState.forEach(function(diceState, index) {
                self.dices[index].value(diceState.value);
                self.dices[index].isExposed(diceState.isExposed);
            });
        };
    }

    function Dice(diceState, doubt) {
        var self = this;
        self.isExposed = ko.observable(diceState.isExposed);
        self.value = ko.observable(diceState.value);

        self.color = ko.computed(function() { return self.isExposed() ? '#545454' : '#939393'; });
        self.matchingColor = ko.computed({
            read: function() {
                var color = 'white';
                if (doubt && doubt.isFinalized()) {
                    if (doubt.dice.value() === self.value() || self.value() === 1) {
                        color = '#d9edf7';
                    }
                }
                return color;
            },
            deferEvaluation: true
        });
    }

    return Doubt;
});
