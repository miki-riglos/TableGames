﻿define(['knockout', 'jquery'], function(ko, $) {

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

            // index actions by eventName
            game.actions.forEach(function(action) {
                game.actions[action.eventName] = action;
            });

            game.change = function(playerName, eventName, gameChangeResults) {
                game.actions[eventName].onExecuted(playerName, gameChangeResults);
            };

            game.setUserGame = game.setUserGame || function(userGameState) { };
            game.changeUserGame = game.changeUserGame || function(eventName, userGameChangeResults) { };

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
