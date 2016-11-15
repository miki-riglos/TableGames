define(['knockout'], function(ko) {

    function TicTacToe(gameConfig, gameState) {
        var self = this;
        var table = gameConfig.table;
        var authentication = gameConfig.authentication;

        var indices = [1, 2, 3];
        self.indices = indices;

        self.playerName1 = table.playerNames()[0];
        self.playerName2 = table.playerNames()[1];

        var symbols = {};
        symbols[self.playerName1] = 'X';
        symbols[self.playerName2] = 'O';

        self.board = {};
        indices.forEach(function(row) {
            self.board[row] = {};
            indices.forEach(function(col) {
                self.board[row][col] = ko.observable();
                self.board[row][col].symbol = ko.computed(function() { return symbols[self.board[row][col]()]; });
                self.board[row][col].isWinning = ko.observable();
            });
        });
        gameState.board.forEach(function(boxState) {
            self.board[boxState.row][boxState.col](boxState.playerName);
        });

        table.activePlayerName(gameState.table.activePlayerName);
        self.isFinalized = ko.observable(gameState.isFinalized);
        gameState.winningBoxes.forEach(function(ab) { self.board[ab.row][ab.col].isWinning(true); });
        self.winnerName = ko.observable(gameState.winnerName);

        // assign box
        self.assignBox = function(row, col) {
            if (table.activePlayerName() !== authentication.userName() || self.isFinalized()) {
                return;
            }
            var gameChangeParameters = {
                row: row,
                col: col
            };
            gameConfig.sendChangeToServer('assignBox', gameChangeParameters);
        };

        self.assignBox.onCompleted = function(playerName, gameChangeResults) {
            self.board[gameChangeResults.row][gameChangeResults.col](playerName);
            table.activePlayerName(gameChangeResults.table.activePlayerName);
            if (gameChangeResults.isFinalized) {
                self.isFinalized(gameChangeResults.isFinalized);
                gameChangeResults.winningBoxes.forEach(function(ab) { self.board[ab.row][ab.col].isWinning(true); });
                self.winnerName(gameChangeResults.winnerName);
            }
        };

        // restart
        self.restart = function() {
            if (self.canRestart()) {
                gameConfig.sendChangeToServer('restart', {});
            }
        };
        self.canRestart = ko.computed(function() {
            return table.room.hostName === authentication.userName() && self.isFinalized();
        });

        self.restart.onCompleted = function(playerName, gameChangeResults) {
            gameChangeResults.board.forEach(function(boxState) {
                self.board[boxState.row][boxState.col](boxState.playerName);
                self.board[boxState.row][boxState.col].isWinning(false);
            });

            table.activePlayerName(gameChangeResults.table.activePlayerName);
            self.isFinalized(gameChangeResults.isFinalized);
            gameChangeResults.winningBoxes.forEach(function(ab) { self.board[ab.row][ab.col].isWinning(true); });
            self.winnerName(gameChangeResults.winnerName);
        };
    }

    return TicTacToe;
});
