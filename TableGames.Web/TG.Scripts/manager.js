define(['knockout', 'jquery', 'player', 'notification', 'authentication', 'chat'], function(ko, $, Player, Notification, Authentication, Chat) {

    function Manager(hub) {
        var self = this;

        var players = ko.observableArray();
        var getPlayer = function(playerName) { return players.first(function(player) { return player.name === playerName; }); };

        // main
        self.userPlayer = ko.computed(function() { return players.first(function(player) { return player.name === authentication.userName(); }); });
        self.roomToAdd = ko.observable();
        self.otherPlayers = ko.computed(function() { return players.filter(function(player) { return player.name !== authentication.userName(); }); });
        self.attendedRooms = ko.observableArray();
        self.gameNames = [];

        // notification
        var notification = Notification.instance;
        self.notification = notification;

        // set state
        self.setState = function(currentState) {
            players(currentState.players.map(function(playerState) { return new Player(playerState); }));
            self.gameNames = currentState.gameNames;
            notification.addInfo('Connection established.');
        };

        // authentication
        var authentication = Authentication.instance;
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
                        if (!player) {
                            players.push(new Player({ name: authentication.userName() }));
                        }
                        attendedRoomState.forEach(function(roomState) {
                            var host = getPlayer(roomState.hostName);
                            var room = host ? host.getRoom(roomState.name) : null;
                            if (room) {
                                self.enterRoom(room);
                            }
                        });
                    })
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };

        hub.client.onLoggedIn = function(userName) {
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

        // chat
        var chat = new Chat({ sendMessageToServer: hub.server.sendMessage });
        self.chat = chat;

        hub.client.onMessageSent = function(userName, message) {
            chat.addMessage(userName, message);
        };

        // rooms
        // ... add
        self.addRoom = function() {
            if (self.roomToAdd()) {
                if (!self.userPlayer().getRoom(self.roomToAdd())) {
                    hub.server.addRoom(authentication.userName(), self.roomToAdd())
                        .catch(function(err) {
                            notification.addError(err.message);
                        });
                } else {
                    notification.addError('Room Name already exists.');
                }
            }
        };

        hub.client.onRoomAdded = function(userName, roomState) {
            var player = getPlayer(userName);
            if (!player) {
                player = new Player({ name: userName });
                players.push(player);
            }
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
            if (player.rooms().length === 0) {
                players.remove(player);
            }
            notification.addInfo(userName + ' removed room ' + roomState.name + '.');
        };

        // ... enter
        self.enterRoom = function(room) {
            if (!self.attendedRooms.contains(room)) {
                hub.server.enterRoom(room.hostName, room.name, authentication.userName());
            }
        };

        hub.client.onRoomEntered = function(hostName, roomState, userName, tableState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((userName || 'Attendee') + ' entered ' + hostName + '/' + roomState.name + '.');
            // update attendedRooms if is userName, avoid dups when multiple logins
            if (authentication.isLoggedIn() && authentication.userName() === userName) {
                hub.client.onRoomAttended(hostName, roomState, tableState);
            }
        };

        hub.client.onRoomAttended = function(hostName, roomState, tableState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            if (!self.attendedRooms.contains(room)) {
                var chatConfig = {
                    sendMessageToServer: function(userName, messageToSend) {
                        return hub.server.sendRoomMessage(room.hostName, room.name, userName, messageToSend);
                    }
                };
                room.attend(tableState, chatConfig);
                self.attendedRooms.push(room);
                if (tableState && tableState.game) {
                    room.table().start(tableState.status, getGameConfig(room), tableState.game);
                }
            }
        };

        // ... room chat
        hub.client.onRoomMessageSent = function(hostName, roomName, userName, message) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.chat().addMessage(userName, message);
        };

        // ... leave
        self.leaveRoom = function(room) {
            if (self.attendedRooms.contains(room)) {
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
            room.unattend();
        };

        // table
        // ... create
        self.createTable = function(room) {
            if (authentication.isLoggedIn() && authentication.userName() === room.hostName && room.selectedGameName()) {
                hub.server.createTable(room.hostName, room.name, room.selectedGameName());
            }
        };

        hub.client.onTableCreated = function(hostName, roomName, tableState) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.createTable(tableState);
            notification.addInfo(tableState.gameName + ' opened in room ' + hostName + '/' + roomName + '.');
        };

        // ... join
        self.joinTable = function(table) {
            if (table.canJoin()) {
                hub.server.joinTable(table.room.hostName, table.room.name, authentication.userName());
            }
        };

        hub.client.onPlayerJoinedTable = function(hostName, roomName, playerName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();

            table.addPlayerName(playerName);
            notification.addInfo(playerName + ' joined table ' + table.gameName + ' in room ' + hostName + '/' + roomName + '.');
        };

        // ... leave
        self.leaveTable = function(table) {
            if (table.canLeave()) {
                hub.server.leaveTable(table.room.hostName, table.room.name, authentication.userName());
            }
        };

        hub.client.onPlayerLeftTable = function(hostName, roomName, playerName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();

            table.removePlayerName(playerName);
            notification.addInfo(playerName + ' left table ' + table.gameName + ' in room ' + hostName + '/' + roomName + '.');
        };

        // ... start
        self.startTable = function(table) {
            if (authentication.userName() === table.room.hostName) {
                hub.server.startTable(table.room.hostName, table.room.name);
            }
        };

        function getGameConfig(room) {
            var gameConfig = {
                sendChangeToServer: function(eventName, gameChangeParameters) {
                    return hub.server.changeGame(room.hostName, room.name, authentication.userName(), eventName, gameChangeParameters);
                },
                room: room,
                authentication: authentication
            };
            return gameConfig;
        }

        hub.client.onTableStarted = function(hostName, roomName, tableStatus, gameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();

            table.start(tableStatus, getGameConfig(room), gameState);
            notification.addInfo('Table ' + table.gameName + ' in room ' + hostName + '/' + roomName + ' just started.');
        };

        // ... ... games 
        hub.client.onGameChanged = function(hostName, roomName, playerName, eventName, gameChangeResults) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();
            var game = table.game();

            game.change(playerName, eventName, gameChangeResults);
            notification.addInfo(table.gameName + ' changed in room ' + hostName + '/' + roomName + '.');
        };

        // ... destroy
        self.destroyTable = function(room) {
            if (authentication.userName() === room.hostName) {
                hub.server.destroyTable(room.hostName, room.name);
            }
        };

        hub.client.onTableDestroyed = function(hostName, roomName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var gameName = room.table().gameName;

            room.destroyTable();
            notification.addInfo(gameName + ' closed in room ' + hostName + '/' + roomName + '.');
        };
    }

    return Manager;
});
