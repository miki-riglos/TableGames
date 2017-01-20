﻿define(['knockout', 'jquery', 'tmpl!Doubt/dice'], function(ko, $, diceTemplateName) {

    function Dice(diceState, doubt) {
        var self = this;
        self.isExposed = ko.observable(diceState.isExposed);
        self.value = ko.observable(diceState.value);
        self.rollCount = diceState.rollCount || 0;

        // roll dice
        self.roll = function(value) {
            var promise = $.when();
            for (var i = 1; i <= 8; i++) {
                promise = promise.then(self.roll.step);
            }
            promise = promise.then(function() {
                self.value(value);
            });
        };
        self.roll.step = function() {
            var dfd = $.Deferred();
            var stepValue = Math.floor(Math.random() * 6) + 1;
            self.value(stepValue);
            setTimeout(function() { dfd.resolve(stepValue); }, 100);
            return dfd.promise();
        };

        self.color = ko.computed(function() { return self.isExposed() ? '#545454' : '#939393'; });
        self.matchingColor = ko.computed({
            read: function() {
                var color = 'white';
                if (doubt && doubt.isEnded()) {
                    if (doubt.dice.value() === self.value() || self.value() === 1) {
                        color = '#d9edf7';
                    }
                }
                return color;
            },
            deferEvaluation: true
        });
    }
    Dice.templateName = diceTemplateName;

    return Dice;
});
