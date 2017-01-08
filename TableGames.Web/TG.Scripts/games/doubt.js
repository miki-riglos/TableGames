define(['knockout'], function(ko) {

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

        self.hasBet = ko.computed(function() { return self.dice.value() > 0; });

        table.activePlayerName(gameState.table.activePlayerName);

        self.end = function(gameChangeResults) {
            self.actualQuantity(gameChangeResults.actualQuantity);
            self.playerCups.update(gameChangeResults.playerCups);
            self.isEnded(gameChangeResults.isEnded);
            
            table.status(gameChangeResults.table.status);
            table.activePlayerName(gameChangeResults.table.activePlayerName);
            table.stats(gameChangeResults.table.stats);

            table.winnerNames.removeAll();
            gameChangeResults.table.winnerNames.forEach(function(winnerName) {
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

        // stats template
        table.statsTemplateName('doubtStatsTemplate');
    }

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
        self.rollCount = diceState.rollCount || 0;

        // roll dice
        self.roll = function(value) {
            var promise = $.when();
            for (var i = 1; i <= 8; i++) {
                promise = promise.then(self.roll.step);
            }
            promise = promise.then(function() {
                self.value(value);
            });
        };
        self.roll.step = function() {
            var dfd = $.Deferred();
            var stepValue = Math.floor(Math.random() * 6) + 1;
            self.value(stepValue);
            setTimeout(function() { dfd.resolve(stepValue); }, 100);
            return dfd.promise();
        };

        self.color = ko.computed(function() { return self.isExposed() ? '#545454' : '#939393'; });
        self.matchingColor = ko.computed({
            read: function() {
                var color = 'white';
                if (doubt && doubt.isEnded()) {
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
