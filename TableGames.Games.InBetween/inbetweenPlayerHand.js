define(['knockout', 'game!playerHand'], function(ko, PlayerHand) {

    function DoubtPlayerHand(playerHandState) {
        var self = this;

        PlayerHand.call(self, playerHandState);

        self.chips = ko.observable(playerHandState.chips);
    }

    return DoubtPlayerHand;
});
