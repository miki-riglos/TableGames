define(['knockout', 'jquery', 'game!delay', 'tmpl!InBetween/inBetween', 'game!card', 'game!InBetween/inBetweenPlayerHand', 'tmpl!InBetween/inBetweenStats', 'tmpl!dial'], function(ko, $, delay, inBetweenTemplateName, Card, InBetweenPlayerHand, inBetweenStatsTemplateName, dialTemplateName) {

    function InBetween(gameConfig, gameState, table) {
        var self = this;

        self.bank = ko.observableRunner(gameState.bank);
        self.pot = ko.observableRunner(gameState.pot);

        self.playerHands = gameState.playerHands.map(function(playerHandState) { return new InBetweenPlayerHand(playerHandState); });
        self.playerHands.update = function(playerHandsState) {
            playerHandsState.forEach(function(playerHandState, index) {
                self.playerHands[index].updateCards(playerHandState.cards);
                self.playerHands[index].chipsPurchased(playerHandState.chipsPurchased);
                self.playerHands[index].chipsBalance(playerHandState.chipsBalance);
                self.playerHands[index].bet(playerHandState.bet);
                self.playerHands[index].payment(playerHandState.payment);
            });
        };

        table.activePlayerName(gameState.table.activePlayerName);
    }
    InBetween.templateName = inBetweenTemplateName;
    InBetween.statsTemplateName = inBetweenStatsTemplateName;
    InBetween.LOT_AMOUNT = 500;
    InBetween.MIN_BET_AMOUNT = 10;

    InBetween.ActionConstructors = [
        function BetAction(gameConfig, game, table) {
            var self = this;
            self.name = 'bet';

            var userHand = ko.utils.arrayFirst(game.playerHands, function(ph) { return ph.playerName === game.table.activePlayerName(); });

            // max bet
            self.maxBet = ko.computed(function() { return Math.min(userHand.chipsBalance() / 2, game.pot()); });

            // bet amount
            self.amount = ko.observable(InBetween.MIN_BET_AMOUNT);
            self.amount.dial = {
                up: {
                    execute: function() {
                        if (self.amount() < self.maxBet()) {
                            self.amount(self.amount() + InBetween.MIN_BET_AMOUNT);
                        }
                    },
                    enable: table.isUserTurn
                },
                down: {
                    execute: function() {
                        if (self.amount() > InBetween.MIN_BET_AMOUNT) {
                            self.amount(self.amount() - InBetween.MIN_BET_AMOUNT);
                        }
                    },
                    enable: table.isUserTurn
                }
            };
            self.amount.setMaxBet = function() { self.amount(self.maxBet()); };
            self.amount.setMinBet = function() { self.amount(InBetween.MIN_BET_AMOUNT); };

            self.getParameters = function() {
                return {
                    amount: self.amount()
                };
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                var userHandChangeResults = ko.utils.arrayFirst(gameChangeResults.playerHands, function(ph) { return ph.playerName === game.table.activePlayerName(); });

                var promise = $.when()
                                .then(function() {  // update player bet, remove bet from player chips
                                    var betPromise = userHand.bet.runTo(userHandChangeResults.bet);
                                    var chipsPromise = userHand.chipsBalance.runTo(userHand.chipsBalance() - userHandChangeResults.bet);
                                    return $.when(betPromise, chipsPromise);
                                })
                                .then(function() {
                                    userHand.updateCards(userHandChangeResults.cards);
                                    return delay();
                                })
                                .then(function() { // if win
                                    if (userHandChangeResults.payment === userHandChangeResults.bet) {
                                        // pot => bet
                                        var potPromise = game.pot.runTo(gameChangeResults.pot);
                                        var betPromise = userHand.bet.runTo(2 * userHandChangeResults.bet);
                                        var winPromise = $.when(potPromise, betPromise).then(function() {
                                            // bet => chips
                                            var betPromise = userHand.bet.runTo(0);
                                            var chipsPromise = userHand.chipsBalance.runTo(userHandChangeResults.chipsBalance);
                                            return $.when(betPromise, chipsPromise);
                                        });
                                        return winPromise;
                                    }
                                })
                                .then(function() { // if simple lose
                                    if (userHandChangeResults.payment === -userHandChangeResults.bet) {
                                        // bet => pot
                                        var betPromise = userHand.bet.runTo(0);
                                        var potPromise = game.pot.runTo(gameChangeResults.pot);
                                        return $.when(potPromise, betPromise);
                                    }
                                })
                                .then(function() { // if post lose
                                    if (userHandChangeResults.payment === -2 * userHandChangeResults.bet) {
                                        // chips => bet
                                        var chipsPromise = userHand.chipsBalance.runTo(userHandChangeResults.chipsBalance);
                                        var betPromise = userHand.bet.runTo(2 * userHandChangeResults.bet);
                                        var losePromise = $.when(chipsPromise, betPromise).then(function() {
                                            // bet => pot
                                            var betPromise = userHand.bet.runTo(0);
                                            var potPromise = game.pot.runTo(gameChangeResults.pot);
                                            return $.when(betPromise, potPromise);
                                        });
                                        return losePromise;
                                    }
                                })
                                .then(function() {
                                    userHand.payment(userHandChangeResults.payment);
                                    game.isEnded(gameChangeResults.isEnded);
                                    table.status(gameChangeResults.table.status);
                                    table.activePlayerName(gameChangeResults.table.activePlayerName);
                                    table.stats(gameChangeResults.table.stats);
                                });
                return promise;
            };
        },
        function BuyAction(gameConfig, game, table) {
            var self = this;
            self.name = 'buy';

            var userHand = ko.utils.arrayFirst(game.playerHands, function(ph) { return ph.playerName === game.table.activePlayerName(); });

            self.returnChips = ko.observable(false);
            self.returnChips.enable = ko.computed(function() { return table.isUserTurn() && userHand.chipsBalance() > InBetween.LOT_AMOUNT; });

            self.getParameters = function() {
                return {
                    returnChips: self.returnChips()
                };
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                var userHandChangeResults = ko.utils.arrayFirst(gameChangeResults.playerHands, function(ph) { return ph.playerName === game.table.activePlayerName(); });

                var purchasedPromise = userHand.chipsPurchased.runTo(userHandChangeResults.chipsPurchased);
                var chipsPromise = userHand.chipsBalance.runTo(userHandChangeResults.chipsBalance);
                var bankPromise = game.bank.runTo(gameChangeResults.bank);

                var promise = $.when(purchasedPromise, chipsPromise, bankPromise).then(function() {
                    self.returnChips(false);    // reset returnChips checkbox
                });

                return promise;
            };
        }
    ];

    return InBetween;
});
