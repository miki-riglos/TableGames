define(['knockout', 'game!card'], function(ko, Card) {

    function PlayerHand(playerHandState) {
        var self = this;
        self.playerName = playerHandState.playerName;
        self.cards = ko.observableArray(playerHandState.cards.map(function(cardState) { return new Card(cardState); }));

        self.updateCards = function(cardsState) {
            cardsState.forEach(function(cardState, index) {
                var card = self.cards()[index];
                card.suit(cardState.suit);
                card.rank(cardState.rank);
                card.isExposed(cardState.isExposed);
                card.isHighlighted(cardState.isHighlighted);
            });
        };
    }

    return PlayerHand;
});
