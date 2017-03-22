define(['knockout', 'tmpl!InBetween/inBetween', 'game!card', 'game!InBetween/inBetweenPlayerHand', 'tmpl!InBetween/inBetweenStats', 'tmpl!dial'], function(ko, inBetweenTemplateName, Card, InBetweenPlayerHand, inBetweenStatsTemplateName, dialTemplateName) {

    function InBetween(gameConfig, gameState, table) {
        var self = this;

        self.bank = ko.observable(gameState.bank);
        self.pot = ko.observable(gameState.pot);

        self.playerHands = gameState.playerHands.map(function(playerHandState) { return new InBetweenPlayerHand(playerHandState); });
        self.playerHands.update = function(playerHandsState) {
            playerHandsState.forEach(function(playerHandState, index) {
                self.playerHands[index].updateCards(playerHandState.cards);
                self.playerHands[index].chipsPurchased(playerHandState.chipsPurchased);
                self.playerHands[index].chipsBalance(playerHandState.chipsBalance);
            });
        };

        self.bet = ko.observable(gameState.bet);

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
                            self.amount(self.amount() +InBetween.MIN_BET_AMOUNT);
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
                game.bet(gameChangeResults.bet);
                game.playerHands.update(gameChangeResults.playerHands);
                game.pot(gameChangeResults.pot);
                game.isEnded(gameChangeResults.isEnded);
                table.status(gameChangeResults.table.status);
                table.activePlayerName(gameChangeResults.table.activePlayerName);
                table.stats(gameChangeResults.table.stats);
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
                game.playerHands.update(gameChangeResults.playerHands);
                game.bank(gameChangeResults.bank);
                table.stats(gameChangeResults.table.stats);
                // reset
                self.returnChips(false);
            };
        }
    ];

    return InBetween;
});
