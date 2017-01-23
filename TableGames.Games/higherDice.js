define(['knockout', 'jquery', 'tmpl!higherDice', 'game!dice', 'game!playerCup'], function(ko, $, higherDiceTemplateName, Dice, PlayerCup) {

    function HigherDice(gameConfig, gameState, table) {
        var self = this;
        var playerPromises = {};
        var winnerDice;

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
                if (diceState.isHighlighted) {
                    dice.isHighlighted(false);  // highlight after animations
                    winnerDice = dice;
                }

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

        // set active player after animation
        self.isEnded = ko.observable(false);
        self.initPromise = playerPromises[gameState.table.activePlayerName].then(function() {
            winnerDice.isHighlighted(true);
            table.activePlayerName(gameState.table.activePlayerName);
            self.isEnded(gameState.isEnded);
        });
    }
    HigherDice.templateName = higherDiceTemplateName;

    function delay() {
        var dfd = $.Deferred();
        setTimeout(function() { dfd.resolve(); }, 1000);
        return dfd.promise();
    }

    return HigherDice;
});
