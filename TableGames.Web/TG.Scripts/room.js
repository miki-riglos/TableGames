define(['knockout', 'chat', 'game'], function(ko, Chat, Game) {

    function Room(roomState) {
        var self = this;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        self.chat = ko.observable();
        self.game = ko.observable();

        self.createGame = function(gameState) {
            self.game(new Game(gameState, self));
        };
        self.destroyGame = function() {
            self.game(null);
        };

        self.attend = function(chatConfig, gameState) {
            self.chat(new Chat(chatConfig.authentication, chatConfig.sendMessageToServer));
            if (gameState) {
                self.createGame(gameState);
            }
        };

        self.unattend = function() {
            self.chat(null);
            self.destroyGame();
        };
    }

    return Room;
});
