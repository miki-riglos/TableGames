define(['knockout', 'jquery'], function(ko, $) {

    function DialogOption(optionConfig) {
        var self = this;

        self.id = optionConfig.id;
        self.label = optionConfig.label;
        self.classNames = optionConfig.classNames || 'btn-default';
    }

    function Dialog(dialogConfig) {
        var self = this;

        self.title = dialogConfig.title;
        self.message = dialogConfig.message;
        self.options = dialogConfig.options.map(function(optionConfig) { return new DialogOption(optionConfig); });

        self.selected = function(option) {
            dialogConfig.onSelection(option);
            Dialog.current(null);
        };
        self.hidden = function() {
            dialogConfig.onHidden();
            Dialog.current(null);
        };

        Dialog.current(self);
    }

    Dialog.current = ko.observable();

    Dialog.confirm = function(message, option1, option2) {
        option1 = option1 || {};
        option2 = option2 || {};

        var dfd = $.Deferred();

        var confirmDialog = new Dialog({
            title: 'Confirm',
            message: message,
            options: [{
                id: Dialog.confirm.YES,
                label: option1.label || 'Yes',
                classNames: option1.classNames || 'btn-primary'
            }, {
                id: Dialog.confirm.NO,
                label: option1.label || 'No',
                classNames: option1.classNames || 'btn-default'
            }],
            onSelection: function(option) { dfd.resolve(option); },
            onHidden: function() { dfd.reject(); }
        });

        return dfd.promise();
    };
    Dialog.confirm.YES = {};
    Dialog.confirm.NO = {};

    return Dialog;
});
