define(['knockout', 'chat', 'game'], function(ko, Chat, Game) {

    function Room(roomState) {
        var self = this;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        // chat
        self.chat = ko.observable();
        self.createChat = function(authentication, sendMessageToServer) {
            self.chat(new Chat(authentication, sendMessageToServer));
        };
        self.destroyChat = function() {
            self.chat(null);
        };

        // game
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
