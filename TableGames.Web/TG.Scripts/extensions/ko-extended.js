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

    ko.observableArray.fn.any = function(predicate) {
        return ko.utils.arrayFilter(this(), predicate || function() { return true; }).length > 0;
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

    ko.bindingHandlers.scroll = {
        update: function(element, valueAccessor, allBindings, viewModel) {
            var parentElement = element.parentElement;
            // allow added element to be data bound and include height
            window.setTimeout(function() {
                parentElement.scrollTop = parentElement.scrollHeight;
            }, 0);
        }
    };

    return ko;
});

