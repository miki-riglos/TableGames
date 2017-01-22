define(function() {

    return {
        load: function(name, req, onLoad, config) {
            var data = {
                fileName: name
            };

            var parts = name.split('/');
            if (parts.length > 1) {
                data.gameName = parts[0];
                data.fileName = parts[1];
            }

            var fileUrl = '/GameScript?' + $.param(data);

            req([fileUrl], function(game) {
                onLoad(game);
            });
        }
    };

});