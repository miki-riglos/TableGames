define(['knockout'], function(ko) {

    function UserSettings(userSettingsState) {
        var self = this;

        self.joinTableAfterRoomEntered = ko.observable(userSettingsState.joinTableAfterRoomEntered);
        self.joinTableAfterTableCreated = ko.observable(userSettingsState.joinTableAfterTableCreated);
    }

    UserSettings.default = new UserSettings({});

    return UserSettings;
});
