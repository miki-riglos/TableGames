define(['knockout', 'game!dice'], function(ko, Dice) {

    function PlayerCup(playerCupState) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = ko.observableArray(playerCupState.dices.map(function(diceState) { return new Dice(diceState); }));

        self.updateDices = function(dicesState) {
            dicesState.forEach(function(diceState, index) {
                var dice = self.dices()[index];
                if (dice) {
                    dice.value(diceState.value);
                    dice.isExposed(diceState.isExposed);
                    dice.isHighlighted(diceState.isHighlighted);
                } else {
                    self.dices.push(new Dice(diceState));
                }
            });
        };
    }

    return PlayerCup;
});
