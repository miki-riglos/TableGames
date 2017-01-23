define(['game!playerCup'], function(PlayerCup) {

    function DoubtPlayerCup(playerCupState) {
        var self = this;

        PlayerCup.call(self, playerCupState);

        self.lockStatus = playerCupState.lockStatus;
    }

    return DoubtPlayerCup;
});
