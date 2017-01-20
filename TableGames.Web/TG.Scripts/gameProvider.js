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

        require(['game!' + gameInfo.constructorFileName], function(Constructor) {
            var game = new Constructor(gameConfig, gameState, gameConfig.table);

            game.table = gameConfig.table;

            game.isEnded = game.isEnded || ko.observable(gameState.isEnded);
            game.winnerNames = game.winnerNames || ko.observableArray(gameState.winnerNames);

            // instantiate actions and attach to game
            game.actions = {};
            Constructor.ActionConstructors.forEach(function(ActionConstructor) {
                var action = new ActionConstructor(gameConfig, game, gameConfig.table);
                action.getParameters = action.getParameters || function() { return {}; };
                action.execute = action.execute || function() {
                    if (game.table.isUserTurn()) {
                        var gameChangeParameters = action.getParameters();
                        gameConfig.sendChangeToServer(action.name, gameChangeParameters)
                                  .catch(function(err) {
                                      gameConfig.notification.addError(err.message);
                                  });
                    }
                };
                game.actions[action.name] = action;
            });

            game.change = function(playerName, actionName, gameChangeResults) {
                if (!game.table.isUserTurn()) {
                    game.table.room.beeper.beep();
                }
                game.actions[actionName].onExecuted(playerName, gameChangeResults);
            };

            game.setUserGame = game.setUserGame || function(userGameState) { };
            game.changeUserGame = game.changeUserGame || function(actionName, userGameChangeResults) { };

            // templates
            game.table.gameTemplateName(Constructor.templateName);
            if (Constructor.statsTemplateName) {
                game.table.statsTemplateName(Constructor.statsTemplateName);
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
