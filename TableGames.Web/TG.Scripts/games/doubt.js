define(['knockout'], function(ko) {

    function Doubt(gameConfig, gameState) {
        var self = this;
        var table = gameConfig.table;
        var authentication = gameConfig.authentication;

        self.quantity = ko.observable(gameState.quantity);
        self.diceValue = ko.observable(gameState.diceValue);

        self.playerCups = gameState.playerCups;

        table.activePlayerName(gameState.table.activePlayerName);

        // user game
        self.userGame = {
            dices: ko.observableArray()
        };

        self.changeUserGame = function(userGameState) {
            userGameState.dices.forEach(function(dice) {
                self.userGame.dices.push(ko.observable(dice.value));
            });
        };

        if (gameState.userGame) {
            self.changeUserGame(gameState.userGame);
        }


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

    return Doubt;
});
