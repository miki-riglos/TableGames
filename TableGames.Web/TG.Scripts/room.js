define(['knockout', 'authentication', 'chat', 'table', 'beeper'], function(ko, Authentication, Chat, Table, Beeper) {

    var counter = 0;

    function getClientId() {
        counter++;
        return 'room' + counter;
    }

    function Room(roomState) {
        var self = this;
        var authentication = Authentication.instance;

        self.clientId = getClientId();
        self.name = roomState.name;
        self.hostName = roomState.hostName;
        self.attendance = ko.observable(roomState.attendance);

        self.isHost = ko.computed(function() {
            return self.hostName === authentication.userName();
        });

        self.isAttended = ko.observable(false);
        self.table = ko.observable();
        self.chat = ko.observable();

        self.createTable = function(tableState) {
            self.table(new Table(tableState, self));
        };
        self.canCreateTable = ko.computed(function() { return self.isHost() && !self.table(); });

        self.destroyTable = function() {
            self.table(null);
        };
        self.canDestroyTable = ko.computed(function() { return self.isHost() && self.table(); });

        self.attend = function(tableState, chatConfig) {
            self.isAttended(true);
            if (tableState) {
                self.createTable(tableState);
            }
            self.chat(new Chat(chatConfig));
        };

        self.unattend = function() {
            self.isAttended(false);
            self.destroyTable();
            self.chat(null);
        };

        self.beeper = new Beeper();

        // flags for joining table automatically
        self.joinTable = {
            afterRoomEntered: false,
            afterTableCreated: false
        };
        // flag for hiding room list after entering when IsSmall
        self.isEntering = false;
    }

    return Room;
});
