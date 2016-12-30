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

        // board
        self.board = {};
        // ... create
        indices.forEach(function(row) {
            self.board[row] = {};
            indices.forEach(function(col) {
                self.board[row][col] = ko.observable();
                self.board[row][col].symbol = ko.computed(function() { return symbols[self.board[row][col]()]; });
                self.board[row][col].isWinning = ko.observable();
            });
        });
        // ... assign boxes to players
        gameState.board.forEach(function(boxState) { self.board[boxState.row][boxState.col](boxState.playerName); });
        // ... winning boxes
        gameState.winningBoxes.forEach(function(ab) { self.board[ab.row][ab.col].isWinning(true); });

        table.activePlayerName(gameState.table.activePlayerName);
    }

    TicTacToe.ActionConstructors = [
        function AssignBoxAction(ticTacToe, gameConfig) {
            var self = this;
            var table = gameConfig.table;
            var authentication = gameConfig.authentication;

            self.name = 'assignBox';

            self.execute = function(row, col) {
                if (table.activePlayerName() === authentication.userName() && !ticTacToe.isFinalized()) {
                    var gameChangeParameters = { row: row, col: col };
                    gameConfig.sendChangeToServer(self.name, gameChangeParameters);
                }
            };

            self.onExecuted = function(playerName, gameChangeResults) {
                ticTacToe.board[gameChangeResults.row][gameChangeResults.col](playerName);
                table.activePlayerName(gameChangeResults.table.activePlayerName);
                ticTacToe.isFinalized(gameChangeResults.isFinalized);
                gameChangeResults.winningBoxes.forEach(function(ab) { ticTacToe.board[ab.row][ab.col].isWinning(true); });
                if (gameChangeResults.isFinalized) {
                    table.stats(gameChangeResults.table.stats);
                }
            };
        }
    ];

    return TicTacToe;
});
