define(['knockout'], function(ko) {

    // observable array
    ko.observableArray.fn.first = function(predicate) {
        return ko.utils.arrayFirst(this(), predicate || function() { return true; });
    };

    ko.observableArray.fn.filter = function(predicate) {
        return ko.utils.arrayFilter(this(), predicate || function() { return true; });
    };

    ko.observableArray.fn.contains = function(item) {
        return this.indexOf(item) !== -1;
    };

    // bindings
    ko.bindingHandlers.onEnter = {
        init: function(element, valueAccessor, allBindings, viewModel) {
            var action = valueAccessor();
            $(element).keyup(function(event) {
                var keyCode = event.which ? event.which : event.keyCode;
                if (keyCode === 13) {
                    action.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };

    return ko;
});

