define(['knockout', 'game!dice'], function(ko, Dice) {

    function PlayerCup(playerCupState, doubt) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = ko.observableArray(playerCupState.dices.map(function(diceState) { return new Dice(diceState, doubt); }));
        self.lockStatus = playerCupState.lockStatus;

        self.updateDices = function(dicesState) {
            dicesState.forEach(function(diceState, index) {
                var dice = self.dices()[index];
                dice.value(diceState.value);
                dice.isExposed(diceState.isExposed);
            });
        };
    }

    return PlayerCup;
});
