define(['knockout', 'game!playerHand'], function(ko, PlayerHand) {

    function DoubtPlayerHand(playerHandState) {
        var self = this;

        PlayerHand.call(self, playerHandState);

        self.chipsPurchased = ko.observableRunner(playerHandState.chipsPurchased);
        self.chipsBalance = ko.observableRunner(playerHandState.chipsBalance);

        self.bet = ko.observableRunner(playerHandState.bet);
        self.payment = ko.observable(playerHandState.payment);
    }

    return DoubtPlayerHand;
});
