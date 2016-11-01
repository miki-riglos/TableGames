define(['knockout', 'player'], function(ko, Player) {

    function Manager(hub, notification, authentication) {
        var self = this;

        self.isLoggedIn = authentication.isLoggedIn;

        self.players = ko.observableArray();

        self.messages = notification.messages;

        self.initialize = function(currentState) {
            self.players(currentState.players.map(function(playerState) { return new Player(playerState); }));
        };


        function _getPlayer(playerName) {
            return ko.utils.arrayFirst(self.players(), function(player) { return player.name === playerName; });
        }

        // Authentication
        hub.client.onLoggedIn = function(userName) {
            self.players.push(new Player({ name: userName }));
            notification.addInfo(userName + ' just joined.');
        };

        hub.client.onLoggedOut = function(userName) {
            self.players.remove(function(player) {
                return player.name === userName;
            });
            notification.addInfo(userName + ' just left.');
        };

        // Rooms
        // ... add
        self.roomToAdd = ko.observable();

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
