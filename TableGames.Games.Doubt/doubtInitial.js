define(['knockout', 'jquery', 'tmpl!Doubt/doubtInitial', 'game!Doubt/dice', 'game!Doubt/playerCup'], function(ko, $, doubtInitialTemplateName, Dice, PlayerCup) {

    function DoubtInitial(gameConfig, gameState, table) {
        var self = this;
        var playerPromises = {};

        // initialize player cups
        self.playerCups = gameState.playerCups.map(function(playerCupState) {
            playerPromises[playerCupState.playerName] = $.when();

            var playerCup = new PlayerCup({
                playerName: playerCupState.playerName,
                dices: []
            });

            // ... add dices
            playerCupState.dices.forEach(function(diceState) {
                var dice = new Dice(diceState);
                if (!gameState.inProgress) {
                    playerPromises[playerCupState.playerName] = playerPromises[playerCupState.playerName]
                        .then(function() {
                            playerCup.dices.push(dice);
                            return dice.roll(diceState.value);
                        })
                        .then(delay);
                } else {
                    playerCup.dices.push(dice);
                }
            });

            return playerCup;
        });

        // set active player
        self.isEnded = ko.observable(false);
        playerPromises[gameState.table.activePlayerName].then(function() {
            var winnerCup = ko.utils.arrayFirst(self.playerCups, function(pc) { return pc.playerName === gameState.table.activePlayerName; });
            var winnerLastDice = winnerCup.dices()[winnerCup.dices().length - 1];
            winnerLastDice.isHighlighted(true);

            table.activePlayerName(gameState.table.activePlayerName);
            self.isEnded(gameState.isEnded);
        });
    }
    DoubtInitial.templateName = doubtInitialTemplateName;

    function delay() {
        var dfd = $.Deferred();
        setTimeout(function() { dfd.resolve(); }, 1000);
        return dfd.promise();
    }

    return DoubtInitial;
});
