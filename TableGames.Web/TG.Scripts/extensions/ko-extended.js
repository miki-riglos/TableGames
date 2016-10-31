define(['knockout'], function(ko) {

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

