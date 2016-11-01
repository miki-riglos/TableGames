define(['knockout'], function(ko) {

    function Room(roomState) {
        var self = this;

        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);
    }

    return Room;
});
