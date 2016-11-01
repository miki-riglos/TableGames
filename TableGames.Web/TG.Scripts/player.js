define(['knockout', 'room'], function(ko, Room) {

    function Player(playerState) {
        var self = this;

        self.name = playerState.name;
        self.rooms = ko.observableArray((playerState.rooms || []).map(function(roomState) { return new Room(roomState); }));

        self.addRoom = function(roomState) {
            self.rooms.push(new Room(roomState));
        };

        self.removeRoom = function(roomState) {
            self.rooms.remove(function(room) { return room.name === roomState.name; });
        };

        self.getRoom = function(roomName) {
            return ko.utils.arrayFirst(self.rooms(), function(room) { return room.name === roomName; });
        };
    }

    return Player;
});
