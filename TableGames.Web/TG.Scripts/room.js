define(['knockout', 'game'], function(ko, Game) {

    function Room(roomState) {
        var self = this;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        self.game = ko.observable(roomState.game ? new Game(roomState.game) : null);

        self.openGame = function(gameState) {
            self.game(new Game(gameState));
        };
    }

    return Room;
});
