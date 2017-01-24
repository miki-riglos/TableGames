using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using TableGames.Domain.Extensions;

namespace TableGames.Domain
{
    public class GameInfo : GameDescriptorAttribute
    {
        public Type GameType { get; private set; }
        public IEnumerable<Type> ActionTypes { get; private set; }

        public GameInfo(GameDescriptorAttribute gameDescriptor, Type gameType, IEnumerable<Type> actionTypes) {
            this.SetPropertiesFrom(gameDescriptor);
            GameType = gameType;
            ActionTypes = actionTypes;
        }

        public object ToClient() {
            return new {
                name = Name,
                constructorFileName = $"{UrlName}/{ConstructorFileName}",
                isTableGame = IsTableGame,
                minPlayers = MinPlayers,
                maxPlayers = MaxPlayers
            };
        }

        private static Lazy<IEnumerable<GameInfo>> _registry = new Lazy<IEnumerable<GameInfo>>(() => {
            var actionsRegistry = AppDomain.CurrentDomain.GetAssemblies()
                        .SelectMany(a => a.GetTypes())
                        .Where(type => typeof(GameAction).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract);

            return AppDomain.CurrentDomain.GetAssemblies()
                        .SelectMany(a => a.GetTypes())
                        .Where(type => typeof(Game).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                        .Select(gameType => {
                            var gameDescriptor = (GameDescriptorAttribute)gameType.GetCustomAttributes(typeof(GameDescriptorAttribute), false).FirstOrDefault();
                            var actionTypes = actionsRegistry.Where(t => t.GetConstructor(new[] { gameType }) != null);
                            return new GameInfo(gameDescriptor, gameType, actionTypes);
                        });
        });

        public static IEnumerable<GameInfo> Registry => _registry.Value;

        public static Game CreateGame(string gameName, Table table) {
            var gameInfo = Registry.First(gi => gi.Name == gameName);
            var game = (Game)Activator.CreateInstance(gameInfo.GameType, table);

            game.Actions.AddRange(gameInfo.ActionTypes.Select(actionType => (GameAction)Activator.CreateInstance(actionType, game)));

            return game;
        }

        public static string GetGameScript(string gameName, string fileName) {
            return getGameResource(gameName, fileName, "js");
        }

        public static string GetGameTemplate(string gameName, string fileName) {
            return getGameResource(gameName, fileName, "html");
        }

        private static ConcurrentDictionary<string, string> _gameResources = new ConcurrentDictionary<string, string>();

#if !DEBUG
        private static string getGameResource(string gameName, string fileName, string fileExtension) {
            string gameResource;

            var gameKey = $"{gameName}/{fileName}.{fileExtension}";
            if (_gameResources.TryGetValue(gameKey, out gameResource)) {
                return gameResource;
            }

            var gameAssembly = getGameAssembly(gameName);
            var resourceName = gameAssembly.GetManifestResourceNames().First(name => name.EndsWith($"{fileName}.{fileExtension}"));
            using (Stream stream = gameAssembly.GetManifestResourceStream(resourceName)) {
                using (var reader = new StreamReader(stream)) {
                    gameResource = reader.ReadToEnd();
                }
            }

            _gameResources.TryAdd(gameKey, gameResource);

            return gameResource;
        }
#else
        private static string getGameResource(string gameName, string fileName, string fileExtension) {
            string gameResource;
            var gameAssembly = getGameAssembly(gameName);
            var resourcePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, $"../{gameAssembly.GetName().Name}/{fileName}.{fileExtension}");
            using (StreamReader reader = new StreamReader(resourcePath)) {
                gameResource = reader.ReadToEnd();
            }
            return gameResource;
        }
#endif

        private static Assembly getGameAssembly(string gameName) {
            Assembly gameAssembly;
            if (string.IsNullOrEmpty(gameName)) {
                gameAssembly = AppDomain.CurrentDomain.GetAssemblies().First(a => a.FullName.StartsWith("TableGames.Games, Version="));
            }
            else {
                gameAssembly = GameInfo.Registry.First(gi => gi.UrlName == gameName).GameType.Assembly;
            }
            return gameAssembly;
        }
    }
}