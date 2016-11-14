define(['knockout'], function(ko) {

    function TicTacToe(gameConfig, gameState) {
        var self = this;
        var room = gameConfig.room;
        var table = room.table();
        var authentication = gameConfig.authentication;

        var indices = [1, 2, 3];
        self.indices = indices;

        self.playerName1 = table.playerNames()[0];
        self.playerName2 = table.playerNames()[1];

        table.activePlayerName(gameState.activePlayerName);

        var symbols = {};
        symbols[self.playerName1] = 'X';
        symbols[self.playerName2] = 'O';

        self.board = {};
        indices.forEach(function(row) {
            self.board[row] = {};
            indices.forEach(function(col) {
                self.board[row][col] = ko.observable();
                self.board[row][col].symbol = ko.computed(function() { return symbols[self.board[row][col]()]; });
            });
        });
        gameState.board.forEach(function(boxState) {
            self.board[boxState.row][boxState.col](boxState.playerName);
        });

        self.assign = function(row, col) {
            if (table.activePlayerName() !== authentication.userName()) {
                return;
            }
            var gameChangeParameters = {
                row: row,
                col: col
            };
            gameConfig.sendChangeToServer('AssignBox', gameChangeParameters);
        };

        self.change = function(playerName, eventName, gameChangeResults) {
            if (eventName === 'AssignBox') {
                self.board[gameChangeResults.row][gameChangeResults.col](playerName);
                table.activePlayerName(gameChangeResults.activePlayerName);
            }
        };
    }

    return TicTacToe;
});
