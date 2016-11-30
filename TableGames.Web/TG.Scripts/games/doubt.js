define(['knockout'], function(ko) {

    function Doubt(gameConfig, gameState) {
        var self = this;
        var table = gameConfig.table;
        var authentication = gameConfig.authentication;

        self.quantity = ko.observable(gameState.quantity);
        self.dice = new Dice(gameState.dice);

        self.playerCups = gameState.playerCups.map(function(playerCupState) {
            return {
                playerName: playerCupState.playerName,
                dices: playerCupState.dices.map(function(diceState) { return new Dice(diceState); })
            };
        });

        table.activePlayerName(gameState.table.activePlayerName);

        // user game
        self.userGame = null;
        if (gameState.userGame) {
            self.userGame = {
                dices: ko.observableArray(gameState.userGame.dices.map(function(diceState) { return new Dice(diceState); }))
            };
        }

        // chage user game state
        self.changeUserGame = function(userGameState) {
            userGameState.dices.forEach(function(diceState, index) {
                self.userGame.dices()[index].isExposed(diceState.isExposed);
                self.userGame.dices()[index].value(diceState.value);
            });
        };

        // bet
        self.bet = function(row, col) {
            //if (table.activePlayerName() === authentication.userName() && !self.isFinalized()) {
            //    var gameChangeParameters = { row: row, col: col };
            //    gameConfig.sendChangeToServer('assignBox', gameChangeParameters);
            //}
        };

        self.bet.onCompleted = function(playerName, gameChangeResults) {
            //self.board[gameChangeResults.row][gameChangeResults.col](playerName);
            //table.activePlayerName(gameChangeResults.table.activePlayerName);
            //self.isFinalized(gameChangeResults.isFinalized);
            //gameChangeResults.winningBoxes.forEach(function(ab) { self.board[ab.row][ab.col].isWinning(true); });
            //if (gameChangeResults.isFinalized) {
            //    table.stats(gameChangeResults.table.stats);
            //}
        };
    }

    function Dice(diceState) {
        var self = this;

        self.isExposed = ko.observable(diceState.isExposed);
        self.value = ko.observable(diceState.value);
    }

    return Doubt;
});
