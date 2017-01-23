define(function() {

    function gameNameParser(name) {
        var parsed = {
            fileName: name
        };

        var parts = name.split('/');
        if (parts.length > 1) {
            parsed.gameName = parts[0];
            parsed.fileName = parts[1];
        }
        
        return parsed;
    }

    return gameNameParser;
});