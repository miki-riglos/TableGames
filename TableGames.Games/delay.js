define(['jquery'], function($) {

    function delay() {
        var dfd = $.Deferred();
        setTimeout(function() { dfd.resolve(); }, 1000);
        return dfd.promise();
    }

    return delay;
});
