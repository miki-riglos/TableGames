define(['game!Doubt/dice'], function(Dice) {

    function PlayerCup(playerCupState, doubt) {
        var self = this;
        self.playerName = playerCupState.playerName;
        self.dices = playerCupState.dices.map(function(diceState) { return new Dice(diceState, doubt); });
        self.lockStatus = playerCupState.lockStatus;

        self.updateDices = function(dicesState) {
            dicesState.forEach(function(diceState, index) {
                self.dices[index].value(diceState.value);
                self.dices[index].isExposed(diceState.isExposed);
            });
        };
    }

    return PlayerCup;
});
