define(['knockout', 'tmpl!InBetween/inBetween', 'game!card', 'game!InBetween/inBetweenPlayerHand', 'tmpl!InBetween/inBetweenStats', 'tmpl!dial'], function(ko, inBetweenTemplateName, Card, InBetweenPlayerHand, inBetweenStatsTemplateName, dialTemplateName) {

    function InBetween(gameConfig, gameState, table) {
        var self = this;

        self.pot = ko.observable(gameState.pot);

        self.playerHands = gameState.playerHands.map(function(playerHandState) { return new InBetweenPlayerHand(playerHandState); });
        self.playerHands.update = function(playerHandsState) {
            playerHandsState.forEach(function(playerHandState, index) {
                self.playerHands[index].updateCards(playerHandState.cards);
                self.playerHands[index].chips(playerHandState.chips);
            });
        };

        self.bet = ko.observable(gameState.bet);
        self.payment = ko.observable(gameState.payment);

        table.activePlayerName(gameState.table.activePlayerName);
    }
    InBetween.templateName = inBetweenTemplateName;
    InBetween.statsTemplateName = inBetweenStatsTemplateName;

    InBetween.ActionConstructors = [
        function BetAction(gameConfig, game, table) {
            var self = this;
            self.name = 'bet';

            var userHand = ko.utils.arrayFirst(game.playerHands, function(ph) { return ph.playerName === game.table.activePlayerName(); });

            // bet amount
            self.amount = ko.observable(10);
            self.amount.dial = {
                up: {
                    execute: function() {
                        self.amount(self.amount() + 10);
                    },
                    enable: table.isUserTurn
                },
                down: {
                    execute: function() {
                        if (self.amount() > 10) {
                            self.amount(self.amount() - 10);
                        }
                    },
                    enable: table.isUserTurn
                }
            };

            // user chips
            self.chips = ko.computed(function() { return userHand.chips() - self.amount(); });

            self.getParameters = function() {
                return {
                    amount: self.amount()
                };
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                game.bet(gameChangeResults.bet);
                game.playerHands.update(gameChangeResults.playerHands);
                game.payment(gameChangeResults.payment);
                game.pot(gameChangeResults.pot);
                game.isEnded(gameChangeResults.isEnded);
                table.status(gameChangeResults.table.status);
                table.activePlayerName(gameChangeResults.table.activePlayerName);
                table.stats(gameChangeResults.table.stats);
            };
        }
    ];

    return InBetween;
});
