define(['knockout', 'room'], function(ko, Room) {

    function Player(playerState) {
        var self = this;

        self.name = playerState.name;
        self.rooms = ko.observableArray((playerState.rooms || []).map(function(roomState) { return new Room(roomState); }));

        self.addRoom = function(roomState) {
            var room = new Room(roomState);
            self.rooms.push(room);
            return room;
        };

        self.getRoom = function(roomName) {
            return ko.utils.arrayFirst(self.rooms(), function(room) { return room.name === roomName; });
        };

        self.removeRoom = function(room) {
            self.rooms.remove(room);
        };
    }

    return Player;
});
