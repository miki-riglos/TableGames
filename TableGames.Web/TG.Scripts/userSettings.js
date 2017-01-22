define(['knockout'], function(ko) {

    function UserSettings() {
        var self = this;

        self.joinTableAfterRoomEntered = ko.observable(false);
        self.joinTableAfterTableCreated = ko.observable(true);

        self.update = function(userSettingsState) {
            self.joinTableAfterRoomEntered(userSettingsState.joinTableAfterRoomEntered);
            self.joinTableAfterTableCreated(userSettingsState.joinTableAfterTableCreated);
        };
    }

    UserSettings.instance = new UserSettings();

    return UserSettings;
});
