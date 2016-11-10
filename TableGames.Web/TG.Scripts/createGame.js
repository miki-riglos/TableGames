﻿define(['knockout'], function(ko) {

    function TicTacToe(gameConfig, gameState, table, userPlayerName) {
        var self = this;
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
        }

        self.change = function(playerName, eventName, gameChangeResults) {
            if (eventName === 'AssignBox') {
                self.board[gameChangeResults.row][gameChangeResults.col](playerName)
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
