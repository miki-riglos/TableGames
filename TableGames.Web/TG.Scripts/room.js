define(['knockout', 'authentication', 'chat', 'game'], function(ko, Authentication, Chat, Game) {

    function Room(roomState) {
        var self = this;
        var authentication = Authentication.instance;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        self.isHost = ko.computed(function() {
            return self.hostName === authentication.userName();
        });

        self.isAttended = ko.observable(false);
        self.chat = ko.observable();
        self.game = ko.observable();

        self.createGame = function(gameState) {
            self.game(new Game(gameState, self));
        };
        self.canCreateGame = ko.computed(function() { return self.isHost() && !self.game(); });

        self.destroyGame = function() {
            self.game(null);
        };
        self.canDestroyGame = ko.computed(function() { return self.isHost() && self.game(); });

        self.attend = function(chatConfig, gameState) {
            self.isAttended(true);
            self.chat(new Chat(chatConfig));
            if (gameState) {
                self.createGame(gameState);
            }
        };

        self.unattend = function() {
            self.isAttended(false);
            self.chat(null);
            self.destroyGame();
        };
    }

    return Room;
});
