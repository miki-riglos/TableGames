﻿define(['knockout', 'jquery', 'notification', 'dialog', 'authentication', 'chat', 'player', 'gameProvider', 'userSettings'], function(ko, $, Notification, Dialog, Authentication, Chat, Player, gameProvider, UserSettings) {

    function Manager(hub) {
        var self = this;

        var players = ko.observableArray();
        var getPlayer = function(playerName) {
            var player = players.first(function(player) { return player.name === playerName; });
            if (!player && authentication.isLoggedIn()) {
                player = self.userPlayer();
            }
            return player;
        };

        self.hub = hub;

        // notification
        var notification = Notification.instance;
        self.notification = notification;

        self.dialog = Dialog.current;

        // authentication
        var authentication = Authentication.instance;
        self.authentication = authentication;

        // user settings
        var userSettings = ko.observable(UserSettings.default);
        self.userSettings = userSettings;

        // small devices
        self.navbar = null;
        self.navbarShown = function(mgr, event) { self.navbar = $(event.target).data('bs.collapse'); };
        self.navbarHidden = function(mgr, event) { self.navbar = null; };

        self.isRoomListVisible = ko.observable(true);
        self.isRoomListVisible.toggle = function() { self.isRoomListVisible(!self.isRoomListVisible()); };

        self.isSmall = ko.observable();
        self.isSmall.subscribe(function(isSmall) {
            if (!isSmall) {
                self.isRoomListVisible(true);
            }
        });

        self.hideRoomList = function() {
            if (self.isSmall()) {
                self.isRoomListVisible(false);
            }
        };
        self.showRoomList = function() {
            if (self.isSmall()) {
                self.isRoomListVisible(true);
            }
        };

        // main
        self.userPlayer = ko.computed(function() {
            return players.first(function(player) { return player.name === authentication.userName(); });
        });
        self.roomToAdd = ko.observable();

        self.otherPlayers = ko.computed(function() {
            return players.filter(function(player) { return player.name !== authentication.userName(); });
        });
        self.attendedRooms = ko.observableArray();
        self.attendedRooms.subscribe(function(attendedRooms) {
            if (attendedRooms.length === 0) {
                self.showRoomList();
            }
        });

        self.gameNames = [];

        // set state
        self.setState = function(currentState) {
            players(currentState.players.map(function(playerState) { return new Player(playerState); }));
            self.gameNames = currentState.gameInfoRegistry
                                            .filter(function(gameInfo) { return gameInfo.isTableGame; })
                                            .map(function(gameInfo) { return gameInfo.name; });
            gameProvider.register(currentState.gameInfoRegistry);
            notification.addInfo('Connection established.');
        };

        // ... login
        self.login = function() {
            if (!authentication.isLoggedIn() && authentication.nameToLogin()) {
                hub.server.login(authentication.nameToLogin())
                    .then(function(loginResult) {
                        // leave rooms attended anonymously
                        return $.when.apply($, self.attendedRooms().map(function(room) {
                            return self.leaveRoom(room);
                        })).then(function() {
                            return loginResult;
                        });
                    })
                    .then(function(loginResult) {
                        // login
                        authentication.login();
                        // enter attended roomNames
                        loginResult.attendedRooms.forEach(function(roomState) {
                            var host = getPlayer(roomState.hostName);
                            var room = host ? host.getRoom(roomState.name) : null;
                            if (room) {
                                self.enterRoom(room);
                            }
                        });
                        userSettings(new UserSettings(loginResult.userSettings));
                        if (self.navbar) {
                            self.navbar.hide(); // collapse navbar on small devices
                        }
                    })
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
        };

        hub.client.onLoggedIn = function(userName) {
            if (!players.any(function(player) { return player.name === userName; })) {
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
                    userSettings(UserSettings.default);
                    authentication.logout();
                })
                .catch(function(err) {
                    notification.addError(err.message);
                });
        };

        hub.client.onLoggedOut = function(userName) {
            notification.addInfo(userName + ' just logged out.');
        };

        // ... save user settings
        self.saveUserSettings = function() {
            if (authentication.isLoggedIn()) {
                hub.server.saveUserSettings(authentication.userName(), ko.toJS(userSettings()))
                    .catch(function(err) {
                        notification.addError(err.message);
                    });
            }
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
            if (!self.attendedRooms.contains(room)) {
                hub.server.enterRoom(room.hostName, room.name, authentication.userName());
                room.joinTable.afterRoomEntered = userSettings().joinTableAfterRoomEntered();
                room.isEntering = true;
            }
        };

        hub.client.onRoomEntered = function(hostName, roomState, userName, tableState, userGameState) {
            var room = getPlayer(hostName).getRoom(roomState.name);
            room.attendance(roomState.attendance);
            notification.addInfo((userName || 'Attendee') + ' entered ' + hostName + '/' + roomState.name + '.');
            if (room.isEntering) {
                room.isEntering = false;
                self.hideRoomList();
            }
            // update attendedRooms if is userName, avoid dups when multiple logins
            if (authentication.isLoggedIn() && authentication.userName() === userName) {
                hub.client.onRoomAttended(hostName, roomState, tableState, userGameState);
            }
        };

        hub.client.onRoomAttended = function(hostName, roomState, tableState, userGameState) {
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
                    tableState.game.inProgress = true;
                    room.table().start(tableState, getGameConfig(room));
                    if (userGameState) {
                        userGameState.inProgress = true;
                        room.table().setUserGame(userGameState);
                    }
                }
                if (room.joinTable.afterRoomEntered && room.table() && room.table().canJoin()) {
                    self.joinTable(room.table());
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
            return $.when();
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
        self.createTable = function(room, gameName) {
            if (authentication.isLoggedIn() && authentication.userName() === room.hostName) {
                hub.server.createTable(room.hostName, room.name, gameName);
                room.joinTable.afterTableCreated = userSettings().joinTableAfterTableCreated();
            }
        };

        hub.client.onTableCreated = function(hostName, roomName, tableState) {
            var room = getPlayer(hostName).getRoom(roomName);
            room.createTable(tableState);
            notification.addInfo(tableState.gameName + ' opened in room ' + hostName + '/' + roomName + '.');
            if (room.joinTable.afterTableCreated) {
                self.joinTable(room.table());
            }
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
            if (table.canStart()) {
                hub.server.startTable(table.room.hostName, table.room.name);
            }
        };

        hub.client.onTableStarted = function(hostName, roomName, tableToken, tableState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();
            table.token = tableToken;

            table.start(tableState, getGameConfig(room));
            notification.addInfo('Table ' + table.gameName + ' in room ' + hostName + '/' + roomName + ' just started.');
        };

        // ... ... games 
        hub.client.onGameChanged = function(hostName, roomName, tableToken, playerName, actionName, gameChangeResults) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();
            table.token = tableToken;

            table.changeGame(playerName, actionName, gameChangeResults);
            notification.addInfo(table.gameName + ' changed in room ' + hostName + '/' + roomName + '.');
        };

        // ... ... set user game state 
        hub.client.onUserGameStarted = function(hostName, roomName, userGameState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();

            // if user leaves room, table is lost - it will be recreated when re-entering
            if (table) {
                table.setUserGame(userGameState);
            }
        };

        // ... ... change user game state 
        hub.client.onUserGameChanged = function(hostName, roomName, actionName, userGameChangeResults) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();

            table.changeUserGame(actionName, userGameChangeResults);
        };

        // ... ... restart game
        self.restartGame = function(table) {
            var room = table.room;
            if (table.canRestartGame()) {
                hub.server.restartGame(room.hostName, room.name, table.token);
            }
        };

        hub.client.onGameRestarted = function(hostName, roomName, tableToken, tableState) {
            var room = getPlayer(hostName).getRoom(roomName);
            var table = room.table();
            table.token = tableToken;

            table.startGame(tableState, getGameConfig(room));
            notification.addInfo('Table ' + table.gameName + ' in room ' + hostName + '/' + roomName + ' just restarted.');
        };

        // ... destroy
        self.destroyTable = function(room) {
            if (authentication.userName() === room.hostName) {
                Dialog.confirm('Are you sure you want to end active table?').then(function(option) {
                    if (option.id === Dialog.confirm.YES) {
                        hub.server.destroyTable(room.hostName, room.name);
                    }
                });
            }
        };

        hub.client.onTableDestroyed = function(hostName, roomName) {
            var room = getPlayer(hostName).getRoom(roomName);
            var gameName = room.table().gameName;

            room.destroyTable();
            notification.addInfo(gameName + ' closed in room ' + hostName + '/' + roomName + '.');
        };

        function getGameConfig(room) {
            var gameConfig = {
                sendChangeToServer: function(actionName, gameChangeParameters) {
                    return hub.server.changeGame(room.hostName, room.name, room.table().token, authentication.userName(), actionName, gameChangeParameters);
                },
                table: room.table(),
                authentication: authentication,
                notification: notification
            };
            return gameConfig;
        }
    }

    Manager.instance = new Manager($.connection.managerHub);

    return Manager;
});
