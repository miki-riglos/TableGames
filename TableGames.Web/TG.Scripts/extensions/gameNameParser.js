define(function() {

    function gameNameParser(name, extension) {
        var parsed = {
            fileName: name,
            extension: extension
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