define(['knockout'], function(ko) {

    function Box(boxState) {
        this.row = boxState.row;
        this.column = boxState.column;
        this.playerName = ko.observable();
    }

    function TicTacToe(gameConfig, gameState, table, userPlayerName) {
        var self = this;

        self.board = gameState.board.map(function(boxState) { return new Box(boxState) });

        self.playerName1 = table.playerNames()[0];
        self.playerName2 = table.playerNames()[1];

        self.assign = function(box) {
            var gameChangeParameters = {
                row: box.row,
                column: box.column
            };
            gameConfig.sendChangeToServer('AssignBox', gameChangeParameters);
        }

        self.change = function(playerName, eventName, gameChangeResults) {
            if (eventName === 'AssignBox') {
                var assignedBox = ko.utils.arrayFirst(self.board, function(box) { return box.row === gameChangeResults.row && box.column === gameChangeResults.column; });
                assignedBox.playerName(playerName);
            }
        }
    }

    function createGame(gameName, gameConfig, gameState, table, userPlayerName) {
        var game = new TicTacToe(gameConfig, gameState, table, userPlayerName);

        if (!self.change) {
            self.change = function(eventName, gameChangeResults) { };
        }

        return game;
    }

    return createGame;
});
