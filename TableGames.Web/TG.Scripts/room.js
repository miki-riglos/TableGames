define(['knockout', 'game'], function(ko, Game) {

    function Room(roomState) {
        var self = this;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        self.game = ko.observable();

        self.createGame = function(gameState) {
            self.game(new Game(gameState, self));
        };

        self.destroyGame = function() {
            self.game(null);
        };
    }

    return Room;
});
