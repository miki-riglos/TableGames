using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TableGames.Domain
{
    public class GameInfo
    {
        public string Name { get; set; }
        public string UrlName { get { return Name.Replace(" ", string.Empty); } }
        public Type Type { get; set; }
        public string ConstructorFileName { get; set; }
        public IEnumerable<Type> ActionTypes { get; set; }

        public object ToClient() {
            return new {
                name = Name,
                constructorFileName = $"{UrlName}/{ConstructorFileName}",
                isOption = !Name.EndsWith("Initial")
            };
        }

        private static Lazy<IEnumerable<GameInfo>> _registry = new Lazy<IEnumerable<GameInfo>>(() => {
            var actionsRegistry = AppDomain.CurrentDomain.GetAssemblies()
                        .SelectMany(a => a.GetTypes())
                        .Where(type => typeof(GameAction).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract);

            return AppDomain.CurrentDomain.GetAssemblies()
                        .SelectMany(a => a.GetTypes())
                        .Where(type => typeof(Game).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                        .Select(type => {
                            var gameDescriptor = (GameDescriptorAttribute)type.GetCustomAttributes(typeof(GameDescriptorAttribute), false).FirstOrDefault();
                            return new GameInfo() {
                                Name = gameDescriptor.Name,
                                Type = type,
                                ConstructorFileName = gameDescriptor.ConstructorFileName,
                                ActionTypes = actionsRegistry.Where(t => t.GetConstructor(new[] { type }) != null)
                            };
                        });
        });

        public static IEnumerable<GameInfo> Registry => _registry.Value;

        public static Game CreateGame(string gameName, Table table) {
            var gameInfo = Registry.First(gi => gi.Name == gameName);
            var game = (Game)Activator.CreateInstance(gameInfo.Type, table);

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

            var gameAssembly = GameInfo.Registry.First(gi => gi.UrlName == gameName).Type.Assembly;
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
            var gameAssembly = GameInfo.Registry.First(gi => gi.UrlName == gameName).Type.Assembly;
            var resourcePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, $"../{gameAssembly.GetName().Name}/{fileName}.{fileExtension}");
            using (StreamReader reader = new StreamReader(resourcePath)) {
                gameResource = reader.ReadToEnd();
            }
            return gameResource;
        }
#endif
    }
}