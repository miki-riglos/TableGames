define(['knockout', 'tmpl!Doubt/doubt', 'game!dice', 'game!Doubt/doubtPlayerCup', 'tmpl!Doubt/doubtStats', 'tmpl!dial'], function(ko, doubtTemplateName, Dice, DoubtPlayerCup, doubtStatsTemplateName, dialTemplateName) {

    function Doubt(gameConfig, gameState, table) {
        var self = this;

        self.quantity = ko.observable(gameState.quantity);
        self.dice = new Dice(gameState.dice);
        self.hasLock = gameState.hasLock;
        self.actualQuantity = ko.observable(gameState.actualQuantity);

        self.playerCups = gameState.playerCups.map(function(playerCupState) { return new DoubtPlayerCup(playerCupState); });
        self.playerCups.update = function(playerCupsState) {
            playerCupsState.forEach(function(playerCupState, index) {
                self.playerCups[index].updateDices(playerCupState.dices);
            });
        };

        self.endActionName = ko.observable(gameState.endActionName);
        self.diceLoserName = ko.observable(gameState.diceLoserName);
        self.diceWinnerName = ko.observable(gameState.diceWinnerName);

        self.hasBet = ko.computed(function() { return self.dice.value() > 0; });

        table.activePlayerName(gameState.table.activePlayerName);

        self.end = function(gameEndResults) {
            self.actualQuantity(gameEndResults.actualQuantity);
            self.playerCups.update(gameEndResults.playerCups);
            self.isEnded(gameEndResults.isEnded);
            self.endActionName(gameEndResults.endActionName);
            self.diceLoserName(gameEndResults.diceLoserName);
            self.diceWinnerName(gameEndResults.diceWinnerName);

            table.status(gameEndResults.table.status);
            table.activePlayerName(gameEndResults.table.activePlayerName);
            table.stats(gameEndResults.table.stats);

            table.winnerNames.removeAll();
            gameEndResults.table.winnerNames.forEach(function(winnerName) {
                table.winnerNames.push(winnerName);
            });
        };

        // user game
        self.userGame = ko.observable();

        // set user game state
        self.setUserGame = function(userGameState) {
            self.userGame({
                dices: userGameState.dices.map(function(diceState) { return new Dice(diceState, self); })
            });
            // animate dices, userGame must be defined and bound
            if (!userGameState.inProgress) {
                self.userGame().dices.forEach(function(dice) { dice.roll(dice.value()); });
            }
        };

        // change user game state
        self.changeUserGame = function(actionName, userGameChangeResults) {
            userGameChangeResults.dices.forEach(function(diceState, index) {
                self.userGame().dices[index].isExposed(diceState.isExposed);
                if (diceState.rollCount > self.userGame().dices[index].rollCount) {
                    self.userGame().dices[index].roll(diceState.value);
                } else {
                    self.userGame().dices[index].value(diceState.value);
                }
                self.userGame().dices[index].rollCount = diceState.rollCount;
            });
        };
    }
    Doubt.templateName = doubtTemplateName;
    Doubt.statsTemplateName = doubtStatsTemplateName;

    Doubt.ActionConstructors = [
        function BetAction(gameConfig, game, table) {
            var self = this;
            self.name = 'bet';

            // quantity
            self.quantity = ko.observable(game.quantity() || 1);
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
            self.dice = new Dice({ isExposed: true, value: game.dice.value() || 1 });
            self.dice.enable = ko.computed(function() {
                if (game.hasLock) {
                    return !game.hasBet() && table.isUserTurn();
                } else {
                    return table.isUserTurn();
                }
            });
            self.dice.dial = {
                up: {
                    execute: function() {
                        if (self.dice.value() < 6) {
                            self.dice.value(self.dice.value() + 1);
                        }
                    },
                    enable: self.dice.enable
                },
                down: {
                    execute: function() {
                        if (self.dice.value() > 1) {
                            self.dice.value(self.dice.value() - 1);
                        }
                    },
                    enable: self.dice.enable
                }
            };

            // roll other dices
            self.rollOthers = ko.observable(false);

            self.getParameters = function() {
                return {
                    quantity: self.quantity(),
                    diceValue: self.dice.value(),
                    rollOthers: self.rollOthers()
                };
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                game.quantity(gameChangeResults.quantity);
                game.dice.value(gameChangeResults.dice.value);
                game.playerCups.update(gameChangeResults.playerCups);
                table.activePlayerName(gameChangeResults.table.activePlayerName);
                // reset
                self.quantity(gameChangeResults.quantity);
                self.dice.value(gameChangeResults.dice.value);
                self.rollOthers(false);
            };
        },
        function DoubtAction(gameConfig, game, table) {
            var self = this;
            self.name = 'doubt';

            self.onExecuted = function(playerName, gameChangeResults) {
                game.end(gameChangeResults);
            };
        },
        function MatchAction(gameConfig, game, table) {
            var self = this;
            self.name = 'match';

            self.isUserAllowed = ko.computed(function() {
                var userCup = ko.utils.arrayFirst(game.playerCups, function(pc) { return pc.playerName === game.table.activePlayerName(); });
                if (userCup) {
                    return userCup.dices.length < 5;
                }
            });

            self.onExecuted = function(playerName, gameChangeResults) {
                game.end(gameChangeResults);
            };
        }
    ];

    return Doubt;
});
