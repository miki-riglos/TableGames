define(['extensions/gameNameParser'], function(gameNameParser) {

    return {
        load: function(name, req, onLoad, config) {
            var fileUrl = '/GameResource?' + $.param(gameNameParser(name, "js"));

            req([fileUrl], function(game) {
                onLoad(game);
            });
        }
    };

});