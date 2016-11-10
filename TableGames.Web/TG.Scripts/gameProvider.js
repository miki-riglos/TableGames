define(['knockout', 'jquery'], function(ko, $) {

    var registry = {};

    function register(gameInfos) {
        gameInfos.forEach(function(gameInfo) {
            registry[gameInfo.name] = gameInfo;
        });
    }

    function createGame(gameName, gameConfig, gameState) {
        var dfd = $.Deferred();

        var gameInfo = registry[gameName];

        require([gameInfo.constructorFileName], function(Constructor) {
            var game = new Constructor(gameConfig, gameState);

            if (!game.change) {
                game.change = function(eventName, gameChangeResults) { };
            }

            return dfd.resolve(game);
        });


        return dfd.promise();
    }

    return {
        register: register,
        createGame: createGame
    };
});
