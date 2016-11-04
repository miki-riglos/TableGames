define(['knockout', 'player', 'notification', 'authentication', 'chat'], function(ko, Player, Notification, Authentication, Chat) {

    function Manager(hub) {
        var self = this;

        var players = ko.observableArray();
        var getPlayer = function(playerName) { return ko.utils.arrayFirst(players(), function(player) { return player.name === playerName; }); };

        self.userPlayer = ko.computed(function() { return ko.utils.arrayFirst(players(), function(player) { return player.name === authentication.userName(); }); });
        self.roomToAdd = ko.observable();
        self.otherPlayers = ko.computed(function() { return ko.utils.arrayFilter(players(), function(player) { return player.name !== authentication.userName(); }); });
        self.attendedRooms = ko.observableArray();

        self.setState = function(currentState) {
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
            if (!authentication.isLoggedIn() && authentication.nameToLogin()) {
                hub.server.login(authentication.nameToLogin())
                    .then(function() {
                        authentication.login();
                        // enter hosted rooms (when player re-login)
                        var player = getPlayer(authentication.userName());
                        player.rooms().forEach(function(room) {
                            self.enterRoom(room);
                        });
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
                    self.attendedRooms.removeAll();
                    authentication.logout();
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
            authentication.logout();
            notification.addInfo('Logged out, another session was started.');
        };

        // ...... login in new session
        hub.client.onPlayerLoggedIn = function(playerState) {
            notification.addInfo(playerState.name + ' just reconnected.');
        };

        // Chat
        var chat = new Chat(authentication);
        self.chat = chat;

        chat.sendMessageToServer = hub.server.sendMessage;

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
            hub.server.enterRoom(room.hostName, room.name)
                .then(function(gameState) {
                    if (gameState) {
                        room.createGame(gameState);
                    }
                    self.attendedRooms.push(room);
                });
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
                        room.destroyGame();
                        self.attendedRooms.remove(room);
                    });
            }
        };

        hub.client.onRoomLeft = function(hostName, roomState, attendeeName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((attendeeName || 'Attendee') + ' left ' + hostName + '/' + roomState.name + '.');
        };

        // Games
        // ... create
        self.createGame = function(room) {
            hub.server.createGame(room.hostName, room.name, 'gameName');
        };

        hub.client.onGameCreated = function(hostName, roomName, gameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.createGame(gameState);
            notification.addInfo(gameState.name + ' opened in room ' + hostName + '/' + roomName + '.');
        };

        // ... join
        self.joinGame = function(game) {
            hub.server.joinGame(game.room.hostName, game.room.name, authentication.userName());
        };

        hub.client.onGamePlayerJoined = function(hostName, roomName, playerName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var game = room.game();

            game.addPlayerName(playerName);
            notification.addInfo(playerName + ' joined game ' + game.name + ' in room ' + hostName + '/' + roomName + '.');
        };

        // ... start
        self.startGame = function(game) {
            hub.server.startGame(game.room.hostName, game.room.name);
        };

        hub.client.onGameStarted = function(hostName, roomName, gameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var game = room.game();

            game.status(gameState.status);
            notification.addInfo('Game ' + game.name + ' in room ' + hostName + '/' + roomName + ' just started.');
        };

        // ... destroy
        self.destroyGame = function(room) {
            hub.server.destroyGame(room.hostName, room.name);
        };

        hub.client.onGameDestroyed = function(hostName, roomName) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.destroyGame();
            notification.addInfo('Game in room ' + hostName + '/' + roomName + ' just finished.');
        };
    }

    return Manager;
});
