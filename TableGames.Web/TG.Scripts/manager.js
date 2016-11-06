define(['knockout', 'jquery', 'player', 'notification', 'authentication', 'chat'], function(ko, $, Player, Notification, Authentication, Chat) {

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
                    .then(function(attendedRoomState) {
                        // leave rooms attended anonymously
                        return $.when.apply($, self.attendedRooms().map(function(room) {
                            return self.leaveRoom(room);
                        })).then(function() {
                            return attendedRoomState;
                        });
                    })
                    .then(function(attendedRoomState) {
                        // login
                        authentication.login();
                        // enter attended roomNames
                        var player = getPlayer(authentication.userName());
                        if (player) {
                            attendedRoomState.forEach(function(roomState) {
                                var host = getPlayer(roomState.hostName);
                                var room = host ? host.getRoom(roomState.name) : null;
                                if (room) {
                                    self.enterRoom(room);

                                }
                            });
                        }
                    })
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };

        hub.client.onLoggedIn = function(userName) {
            if (!ko.utils.arrayFirst(players(), function(player) { return player.name === userName; })) {
                players.push(new Player({ name: userName }));
            }
            notification.addInfo(userName + ' just logged in.');
        };

        // ... logout
        self.logout = function() {
            hub.server.logout(authentication.userName())
                .then(function() {
                    // leave rooms attended
                    return $.when.apply($, self.attendedRooms().map(function(room) {
                        return self.leaveRoom(room);
                    }));
                })
                .then(function() {
                    authentication.logout();
                })
                .catch(function(err) {
                    notification.addError(err.message);
                });
        };

        hub.client.onLoggedOut = function(userName) {
            notification.addInfo(userName + ' just logged out.');
        };

        // Chat
        var chat = new Chat(authentication, hub.server.sendMessage);
        self.chat = chat;

        hub.client.onMessageSent = function(userName, message) {
            chat.addMessage(userName, message);
        };

        // Rooms
        // ... add
        self.addRoom = function() {
            if (self.roomToAdd()) {
                if (!ko.utils.arrayFirst(self.userPlayer().rooms(), function(room) { return room.name === self.roomToAdd(); })) {
                    hub.server.addRoom(authentication.userName(), self.roomToAdd())
                        .catch(function(err) {
                            notification.addError(err.message);
                        });
                } else {
                    notification.addError('Room Name already exists.')
                }
            }
        };

        hub.client.onRoomAdded = function(userName, roomState) {
            var player = getPlayer(userName);
            var room = player.addRoom(roomState);
            notification.addInfo(userName + ' added room ' + roomState.name + '.');
            // enter room if host
            if (authentication.isLoggedIn() && authentication.userName() === userName) {
                self.roomToAdd(null);
                self.enterRoom(room);
            }
        };

        // ... remove
        self.removeRoom = function(room) {
            if (authentication.isLoggedIn() && authentication.userName() === room.hostName) {
                hub.server.removeRoom(authentication.userName(), room.name)
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };

        hub.client.onRoomRemoved = function(userName, roomState) {
            var player = getPlayer(userName);
            var room = player.getRoom(roomState.name);
            self.attendedRooms.remove(room);
            player.removeRoom(room);
            notification.addInfo(userName + ' removed room ' + roomState.name + '.');
        };

        // ... enter
        self.enterRoom = function(room) {
            if (self.attendedRooms.indexOf(room) === -1) {
                hub.server.enterRoom(room.hostName, room.name, authentication.userName());
            }
        };

        hub.client.onRoomEntered = function(hostName, roomState, userName, gameState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((userName || 'Attendee') + ' entered ' + hostName + '/' + roomState.name + '.');
            // update attendedRooms if is userName, avoid dups when multiple logins
            if (authentication.isLoggedIn() && authentication.userName() === userName) {
                hub.client.onRoomAttended(hostName, roomState, gameState);
            }
        };

        hub.client.onRoomAttended = function(hostName, roomState, gameState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            if (self.attendedRooms.indexOf(room) === -1) {
                room.createChat(authentication, function(userName, messageToSend) {
                    return hub.server.sendRoomMessage(room.hostName, room.name, userName, messageToSend);
                });
                if (gameState) {
                    room.createGame(gameState);
                }
                self.attendedRooms.push(room);
            }
        };

        // ... room chat
        hub.client.onRoomMessageSent = function(hostName, roomName, userName, message) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.chat().addMessage(userName, message);
        };

        // ... leave
        self.leaveRoom = function(room) {
            if (self.attendedRooms.indexOf(room) !== -1) {
                return hub.server.leaveRoom(room.hostName, room.name, authentication.userName());
            }
            return $.Deferred().resolve();
        };

        hub.client.onRoomLeft = function(hostName, roomState, userName) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((userName || 'Attendee') + ' left ' + hostName + '/' + roomState.name + '.');
            // update attendedRooms if is userName
            if (authentication.isLoggedIn() && authentication.userName() === userName) {
                hub.client.onRoomUnattended(hostName, roomState);
            }
        };

        hub.client.onRoomUnattended = function(hostName, roomState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            self.attendedRooms.remove(room);
            room.destroyChat();
            room.destroyGame();
        };

        // Games
        // ... create
        self.createGame = function(room) {
            if (authentication.isLoggedIn() && authentication.userName() === room.hostName) {
                hub.server.createGame(room.hostName, room.name, 'gameName');
            }
        };

        hub.client.onGameCreated = function(hostName, roomName, gameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.createGame(gameState);
            notification.addInfo(gameState.name + ' opened in room ' + hostName + '/' + roomName + '.');
        };

        // ... join
        self.joinGame = function(game) {
            if (game.playerNames.indexOf(authentication.userName()) === -1) {
                hub.server.joinGame(game.room.hostName, game.room.name, authentication.userName());
            }
        };

        hub.client.onGamePlayerJoined = function(hostName, roomName, playerName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var game = room.game();

            game.addPlayerName(playerName);
            notification.addInfo(playerName + ' joined game ' + game.name + ' in room ' + hostName + '/' + roomName + '.');
        };

        // ... start
        self.startGame = function(game) {
            if (authentication.userName() === game.room.hostName) {
                hub.server.startGame(game.room.hostName, game.room.name);
            }
        };

        hub.client.onGameStarted = function(hostName, roomName, gameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var game = room.game();

            game.status(gameState.status);
            notification.addInfo('Game ' + game.name + ' in room ' + hostName + '/' + roomName + ' just started.');
        };

        // ... destroy
        self.destroyGame = function(room) {
            if (authentication.userName() === game.room.hostName) {
                hub.server.destroyGame(room.hostName, room.name);
            }
        };

        hub.client.onGameDestroyed = function(hostName, roomName) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.destroyGame();
            notification.addInfo('Game in room ' + hostName + '/' + roomName + ' just finished.');
        };
    }

    return Manager;
});
