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
                maxPlayers = MaxPlayers,
                autoStartAfter = AutoStartAfter,
                autoRestartAfter = AutoRestartAfter
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

        private static ConcurrentDictionary<string, byte[]> _gameResources = new ConcurrentDictionary<string, byte[]>();

#if !DEBUG
        public static byte[] GetGameResource(string gameName, string fileName, string fileExtension) {
            byte[] gameResource;

            var gameKey = $"{gameName}/{fileName}.{fileExtension}";
            if (_gameResources.TryGetValue(gameKey, out gameResource)) {
                return gameResource;
            }

            var gameAssembly = getGameAssembly(gameName);
            var resourceName = gameAssembly.GetManifestResourceNames().First(name => name.EndsWith($"{fileName.Replace('/', '.')}.{fileExtension}"));

            using (Stream stream = gameAssembly.GetManifestResourceStream(resourceName)) {
                gameResource = new byte[stream.Length];
                stream.Read(gameResource, 0, gameResource.Length);
            }

            _gameResources.TryAdd(gameKey, gameResource);

            return gameResource;
        }

#else
        public static byte[] GetGameResource(string gameName, string fileName, string fileExtension) {
            byte[] gameResource;
            var gameAssembly = getGameAssembly(gameName);
            var resourcePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, $"../{gameAssembly.GetName().Name}/{fileName}.{fileExtension}");

            gameResource = File.ReadAllBytes(resourcePath);

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