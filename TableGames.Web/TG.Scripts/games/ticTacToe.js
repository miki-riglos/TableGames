define(['knockout'], function(ko) {

    function TicTacToe(gameConfig, gameState) {
        var self = this;
        var room = gameConfig.room;
        var table = room.table();
        var authentication = gameConfig.authentication;

        var indices = [1, 2, 3];

        self.playerName1 = table.playerNames()[0];
        self.playerName2 = table.playerNames()[1];

        self.indices = indices;

        self.board = {};
        indices.forEach(function(row) {
            self.board[row] = {};
            indices.forEach(function(col) {
                self.board[row][col] = null;
            });
        });
        gameState.board.forEach(function(boxState) {
            self.board[boxState.row][boxState.col] = ko.observable(boxState.playerName);
        });

        self.assign = function(row, col) {
            var gameChangeParameters = {
                row: row,
                col: col
            };
            gameConfig.sendChangeToServer('AssignBox', gameChangeParameters);
        };

        self.change = function(playerName, eventName, gameChangeResults) {
            if (eventName === 'AssignBox') {
                self.board[gameChangeResults.row][gameChangeResults.col](playerName);
            }
        };
    }

    return TicTacToe;
});
