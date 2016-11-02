define(['knockout', 'player', 'notification', 'authentication', 'chat'], function(ko, Player, Notification, Authentication, Chat) {

    function Manager(hub) {
        var self = this;

        var players = ko.observableArray();
        var getPlayer = function(playerName) { return ko.utils.arrayFirst(players(), function(player) { return player.name === playerName; }); };

        self.userPlayer = ko.computed(function() { return ko.utils.arrayFirst(players(), function(player) { return player.name === authentication.userName(); }); });
        self.roomToAdd = ko.observable();
        self.otherPlayers = ko.computed(function() { return ko.utils.arrayFilter(players(), function(player) { return player.name !== authentication.userName(); }); });
        self.attendedRooms = ko.observableArray();

        // Notification
        var notification = new Notification();
        self.notification = notification;

        // Authentication
        var authentication = new Authentication();
        self.authentication = authentication;

        // ... login
        self.login = function() {
            if (!authentication.isLoggedIn() && authentication.nameToLogin()) {
                hub.server.login(authentication.nameToLogin())
                    .then(function() {
                        authentication.isLoggedIn(true);
                        authentication.userName(authentication.nameToLogin());
                        // enter hosted rooms (when player re-login)
                        var player = getPlayer(authentication.userName());
                        if (player) {
                            self.attendedRooms(player.rooms());
                        }
                    })
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };

        hub.client.onLoggedIn = function(userName) {
            players.push(new Player({ name: userName }));
            notification.addInfo(userName + ' just logged in.');
        };

        // ... logout
        self.logout = function() {
            hub.server.logout(authentication.userName())
                .then(function() {
                    authentication.nameToLogin(null);
                    authentication.isLoggedIn(false);
                    authentication.userName(null);
                })
                .catch(function(err) {
                    notification.addError(err.message);
                });
        };

        hub.client.onLoggedOut = function(userName) {
            players.remove(getPlayer(userName));
            notification.addInfo(userName + ' just logged out.');
        };

        // ... player re-login
        // ...... logout in old session
        hub.client.playerLogout = function() {
            authentication.nameToLogin(null);
            authentication.isLoggedIn(false);
            authentication.userName(null);
            notification.addInfo('Logged out, another session was started.');
        };

        // ...... login in new session
        hub.client.onPlayerLoggedIn = function(playerState) {
            notification.addInfo(playerState.name + ' just reconnected.');
        };

        // Chat
        var chat = new Chat();
        self.chat = chat;

        self.sendMessage = function() {
            if (authentication.isLoggedIn() && chat.messageToSend()) {
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
        // ... add
        self.addRoom = function() {
            if (self.roomToAdd()) {
                hub.server.addRoom(authentication.userName(), self.roomToAdd());
                self.roomToAdd(null);
            }
        };

        hub.client.onRoomAdded = function(playerName, roomState) {
            var player = getPlayer(playerName);
            var room = player.addRoom(roomState);
            notification.addInfo(playerName + ' added room ' + roomState.name + '.');
            // enter room if host
            if (authentication.userName() === playerName) {
                self.enterRoom(room);
            }
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
            // remove from attended rooms
            self.attendedRooms.remove(function(room) { return room.name === roomState.name; });
        };

        // ... enter
        self.enterRoom = function(room) {
            if (self.attendedRooms.indexOf(room) === -1) {
                hub.server.enterRoom(room.hostName, room.name)
                    .then(function() {
                        self.attendedRooms.push(room);
                    });
            }
        };

        hub.client.onRoomEntered = function(hostName, roomState, attendeeName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((attendeeName || 'Attendee') + ' entered ' + hostName + '/' + roomState.name + '.');
        };

        // ... leave
        self.leaveRoom = function(room) {
            if (authentication.userName() !== room.hostName) {
                hub.server.leaveRoom(room.hostName, room.name)
                    .then(function() {
                        self.attendedRooms.remove(room);
                    });
            }
        };

        hub.client.onRoomLeft = function(hostName, roomState, attendeeName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((attendeeName || 'Attendee') + ' left ' + hostName + '/' + roomState.name + '.');
        };

        // initialize state
        self.initialize = function(currentState) {
            players(currentState.players.map(function(playerState) { return new Player(playerState); }));
        };
    }

    return Manager;
});
