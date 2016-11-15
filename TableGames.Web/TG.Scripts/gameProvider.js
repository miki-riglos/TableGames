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

        require([gameInfo.constructorFileName, 'tmpl!' + gameInfo.templateFileName], function(Constructor, templateName) {
            var game = new Constructor(gameConfig, gameState);

            game.isFinalized = game.isFinalized || ko.observable(gameState.isFinalized);
            game.winnerName = game.winnerName || ko.observable(gameState.winnerName);

            game.change = function(playerName, eventName, gameChangeResults) {
                game[eventName].onCompleted(playerName, gameChangeResults);
            };

            game.templateName = templateName;

            return dfd.resolve(game);
        });

        return dfd.promise();
    }

    return {
        register: register,
        createGame: createGame
    };
});
