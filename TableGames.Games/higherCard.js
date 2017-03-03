define(['knockout', 'jquery', 'tmpl!higherCard', 'game!card', 'game!playerHand', 'game!delay'], function(ko, $, higherCardTemplateName, Card, PlayerHand, delay) {

    function HigherCard(gameConfig, gameState, table) {
        var self = this;
        var playerPromises = {};
        var winnerCard;

        // initialize player cups
        self.playerHands = gameState.playerHands.map(function(playerHandState) {
            playerPromises[playerHandState.playerName] = $.when();

            var playerHand = new PlayerHand({
                playerName: playerHandState.playerName,
                cards: []
            });

            // ... add cards
            playerHandState.cards.forEach(function(cardState) {
                var card = new Card(cardState);
                if (cardState.isHighlighted) {
                    card.isHighlighted(false);  // highlight after animations
                    winnerCard = card;
                }

                if (!gameState.inProgress) {
                    playerPromises[playerHandState.playerName] = playerPromises[playerHandState.playerName]
                        .then(function() {
                            playerHand.cards.push(card);
                        })
                        .then(delay);
                } else {
                    playerHand.cards.push(card);
                }
            });

            return playerHand;
        });

        self.isEnded = ko.observable(false);    // won't be override

        // set active player after animation
        self.activate = function() {
            return playerPromises[gameState.table.activePlayerName].then(function() {
                winnerCard.isHighlighted(true);
                table.activePlayerName(gameState.table.activePlayerName);
                self.isEnded(gameState.isEnded);
            });
        };
    }
    HigherCard.templateName = higherCardTemplateName;

    return HigherCard;
});
