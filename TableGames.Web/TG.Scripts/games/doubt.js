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
        self.userGame = ko.observable();

        // set user game state
        self.setUserGame = function(userGameState) {
            self.userGame({
                dices: ko.observableArray(userGameState.dices.map(function(diceState) { return new Dice(diceState); }))
            });
        };

        // change user game state
        self.changeUserGame = function(eventName, userGameChangeResults) {
            userGameChangeResults.dices.forEach(function(diceState, index) {
                self.userGame().dices()[index].isExposed(diceState.isExposed);
                self.userGame().dices()[index].value(diceState.value);
            });
        };

        // bet
        self.bet = function() {
            //if (table.activePlayerName() === authentication.userName() && !self.isFinalized()) {
            //    var gameChangeParameters = { row: row, col: col };
            //    gameConfig.sendChangeToServer('assignBox', gameChangeParameters);
            //}
        };
        self.bet.quantity = ko.observable(1);
        self.bet.quantity.dial = {
            up: function() { self.bet.quantity(self.bet.quantity() + 1); },
            down: function() { self.bet.quantity(self.bet.quantity() - 1); }
        };

        self.bet.dice = new Dice({ value: 1 });
        self.bet.dice.dial = {
            up: function() { self.bet.dice.value(self.bet.dice.value() + 1); },
            down: function() { self.bet.dice.value(self.bet.dice.value() - 1); }
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
