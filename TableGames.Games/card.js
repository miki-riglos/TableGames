define(['knockout', 'tmpl!card'], function(ko, cardTemplateName) {

    var suitNames = { 0: 'unknown', 1: 'clubs', 2: 'hearts', 3: 'spades', 4: 'diamonds' };
    var rankSymbols = { 0: '', 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K' };

    function Card(cardState) {
        var self = this;

        self.isExposed = ko.observable(cardState.isExposed);
        self.suit = ko.observable(cardState.suit);
        self.rank = ko.observable(cardState.rank);
        self.isHighlighted = ko.observable(cardState.isHighlighted);

        self.suitName = ko.computed(function() { return suitNames[self.suit()]; });
        self.rankSymbol = ko.computed(function() { return rankSymbols[self.rank()]; });
    }
    Card.templateName = cardTemplateName;

    return Card;
});
