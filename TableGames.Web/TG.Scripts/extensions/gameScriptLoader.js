define(['extensions/gameNameParser'], function(gameNameParser) {

    return {
        load: function(name, req, onLoad, config) {
            var fileUrl = '/GameScript?' + $.param(gameNameParser(name));

            req([fileUrl], function(game) {
                onLoad(game);
            });
        }
    };

});