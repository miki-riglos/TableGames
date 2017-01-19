define(function() {

    return {
        load: function(name, req, onLoad, config) {
            var parts = name.split('/');
            var fileUrl = '../GameScript?gameName=' + parts[0] + '&fileName=' + parts[1];

            req([fileUrl], function(game) {
                onLoad(game);
            });
        }
    };

});