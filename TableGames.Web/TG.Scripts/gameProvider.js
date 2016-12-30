define(['knockout', 'jquery'], function(ko, $) {

    var registry = {};

    function register(gameInfoRegistry) {
        gameInfoRegistry.forEach(function(gameInfo) {
            registry[gameInfo.name] = gameInfo;
        });
    }

    function createGame(gameName, gameConfig, gameState) {
        var dfd = $.Deferred();

        var gameInfo = registry[gameName];

        require([gameInfo.constructorFileName, 'tmpl!' + gameInfo.templateFileName], function(Constructor, templateName) {
            var game = new Constructor(gameConfig, gameState);

            game.isFinalized = game.isFinalized || ko.observable(gameState.isFinalized);
            game.winnerNames = game.winnerNames || ko.observableArray(gameState.winnerNames);

            // actions by name
            game.actions = {};
            Constructor.ActionConstructors.forEach(function(ActionConstructor) {
                var action = new ActionConstructor(game, gameConfig);
                game.actions[action.name] = action;
            });

            game.change = function(playerName, actionName, gameChangeResults) {
                game.actions[actionName].onExecuted(playerName, gameChangeResults);
            };

            game.setUserGame = game.setUserGame || function(userGameState) { };
            game.changeUserGame = game.changeUserGame || function(actionName, userGameChangeResults) { };

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
