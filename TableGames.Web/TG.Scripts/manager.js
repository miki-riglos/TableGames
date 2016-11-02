define(['knockout', 'player', 'notification', 'authentication', 'chat'], function(ko, Player, Notification, Authentication, Chat) {

    function Manager(hub) {
        var self = this;

        var players = ko.observableArray();
        var getPlayer = function(playerName) { return ko.utils.arrayFirst(players(), function(player) { return player.name === playerName; }); };

        self.initialize = function(currentState) {
            players(currentState.players.map(function(playerState) { return new Player(playerState); }));
        };

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
            players.push(new Player({ name: userName }));
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
            players.remove(getPlayer(userName));
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

        // User Player
        self.userPlayer = ko.computed(function() {
            return ko.utils.arrayFirst(players(), function(player) { return player.name === authentication.userName(); });;
        });

        // Other Players
        self.otherPlayers = ko.computed(function() {
            return ko.utils.arrayFilter(players(), function(player) { return player.name !== authentication.userName(); });;
        });

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
            var player = getPlayer(playerName);
            player.addRoom(roomState);
            notification.addInfo(playerName + ' added room ' + roomState.name + '.');
        };

        // ... remove
        self.removeRoom = function(room) {
            if (authentication.userName() === room.hostName) {
                hub.server.removeRoom(authentication.userName(), room.name);
            }
        };

        hub.client.onRoomRemoved = function(playerName, roomState) {
            var player = getPlayer(playerName);
            player.removeRoom(roomState);
            notification.addInfo(playerName + ' removed room ' + roomState.name + '.');
        };

        // ... enter
        self.enterRoom = function(room) {
            hub.server.enterRoom(room.hostName, room.name);
        };

        hub.client.onRoomEntered = function(hostName, roomState, attendeeName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((attendeeName || 'Attendee') + ' entered ' + hostName + '/' + roomState.name + '.');
        };

        // ... leave
        self.leaveRoom = function(room) {
            if (authentication.userName() !== room.hostName) {
                hub.server.leaveRoom(room.hostName, room.name);
            }
        };

        hub.client.onRoomLeft = function(hostName, roomState, attendeeName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((attendeeName || 'Attendee') + ' left ' + hostName + '/' + roomState.name + '.');
        };
    }

    return Manager;
});
