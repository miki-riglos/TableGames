define(['knockout', 'player', 'notification', 'authentication', 'chat'], function(ko, Player, Notification, Authentication, Chat) {

    function Manager(hub) {
        var self = this;

        self.players = ko.observableArray();

        self.initialize = function(currentState) {
            self.players(currentState.players.map(function(playerState) { return new Player(playerState); }));
        };

        var _getPlayer = function(playerName) { return ko.utils.arrayFirst(self.players(), function(player) { return player.name === playerName; }); };

        // Notification
        var notification = new Notification();
        self.notification = notification;

        // Authentication
        var authentication = new Authentication();
        self.authentication = authentication;

        // ... login
        self.login = function() {
            if (!authentication.isLoggedIn() && authentication.userName()) {
                hub.server.login(authentication.userName())
                .then(function() {
                    authentication.isLoggedIn(true);
                })
                .catch(function(err) {
                    notification.addError(err.message);
                });
            }
        };

        hub.client.onLoggedIn = function(userName) {
            self.players.push(new Player({ name: userName }));
            notification.addInfo(userName + ' just joined.');
        };

        // ... logout
        self.logout = function() {
            hub.server.logout(authentication.userName())
                .then(function() {
                    authentication.isLoggedIn(false);
                    authentication.userName(null);
                })
                .catch(function(err) {
                    notification.addError(err.message);
                });
        };

        hub.client.onLoggedOut = function(userName) {
            self.players.remove(_getPlayer(userName));
            notification.addInfo(userName + ' just left.');
        };

        // Chat
        var chat = new Chat();
        self.chat = chat;

        self.sendMessage = function() {
            if (authentication.isLoggedIn() && authentication.userName() && chat.messageToSend()) {
                hub.server.sendMessage(authentication.userName(), chat.messageToSend())
                    .then(function() {
                        chat.messageToSend(null);
                    });
            }
        };

        hub.client.onMessageSent = function(userName, message) {
            chat.addMessage(userName, message);
        };

        // Rooms
        self.roomToAdd = ko.observable();

        // ... add
        self.addRoom = function() {
            if (self.roomToAdd()) {
                hub.server.addRoom(authentication.userName(), self.roomToAdd());
                self.roomToAdd(null);
            }
        };

        hub.client.onRoomAdded = function(playerName, roomState) {
            var player = _getPlayer(playerName);
            player.addRoom(roomState);
            notification.addInfo(playerName + ' added room ' + roomState.name + '.');
        };

        // ... remove
        self.removeRoom = function(room) {
            hub.server.removeRoom(authentication.userName(), room.name);
        };
        self.removeRoom.isAllowed = function(room) {
            return authentication.userName() === room.hostName;
        };

        hub.client.onRoomRemoved = function(playerName, roomState) {
            var player = _getPlayer(playerName);
            player.removeRoom(roomState);
            notification.addInfo(playerName + ' removed room ' + roomState.name + '.');
        };

        // ... enter
        self.enterRoom = function(room) {
            hub.server.enterRoom(room.hostName, room.name);
        };

        hub.client.onRoomEntered = function(hostName, roomState) {
            var room = _getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo('Attendee entered ' + hostName + '/' + roomState.name + '.');
        };

        // ... leave
        self.leaveRoom = function(room) {
            hub.server.leaveRoom(room.hostName, room.name);
        };

        hub.client.onRoomLeft = function(hostName, roomState) {
            var room = _getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo('Attendee left ' + hostName + '/' + roomState.name + '.');
        };
    }

    return Manager;
});
