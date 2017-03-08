define(['knockout', 'game!playerHand'], function(ko, PlayerHand) {

    function DoubtPlayerHand(playerHandState) {
        var self = this;

        PlayerHand.call(self, playerHandState);

        self.chipsPurchased = ko.observable(playerHandState.chipsPurchased);
        self.chipsBalance = ko.observable(playerHandState.chipsBalance);
    }

    return DoubtPlayerHand;
});
