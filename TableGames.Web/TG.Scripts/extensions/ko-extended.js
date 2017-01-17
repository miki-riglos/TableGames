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
    // ... onEnter (keyup)
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

    // ... scrollForeach
    ko.bindingHandlers.scrollForeach = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var result = ko.bindingHandlers['foreach'].init(element, valueAccessor, allBindings, viewModel, bindingContext);
            return result;
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var newValueAccessor = function() {
                return {
                    data: ko.unwrap(valueAccessor()),
                    afterAdd: function(elem) {
                        if (elem.nodeType === 1) {
                            var parentElement = elem.parentElement;
                            parentElement.scrollTop = parentElement.scrollHeight;
                        }
                    }
                };
            };
            var result = ko.bindingHandlers['foreach'].update(element, newValueAccessor, allBindings, viewModel, bindingContext);
            return result;
        }
    };

    return ko;
});

