define(['jquery'], function($) {

    function delay() {
        var dfd = $.Deferred();
        setTimeout(function() { dfd.resolve(); }, 1000);
        return dfd.promise();
    }

    delay.repeat = function(times) {
        var promise = $.when();
        for (var i = 0; i <= times; i++) {
            promise = promise.then(delay);
        }
        return promise;
    };

    return delay;
});
