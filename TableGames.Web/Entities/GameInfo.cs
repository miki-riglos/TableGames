using System;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Web.Entities
{
    [AttributeUsage(AttributeTargets.Class)]
    public class GameDescriptorAttribute : Attribute
    {
        public string Name { get; set; }
        public string ConstructorFileName { get; set; }
        public string TemplateFileName { get; set; }

        public GameDescriptorAttribute(string name, string clientFileName) {
            Name = name;
            ConstructorFileName = clientFileName;
            TemplateFileName = clientFileName;
        }

        public GameDescriptorAttribute(string name, string constructorFileName, string templateFileName) {
            Name = name;
            ConstructorFileName = constructorFileName;
            TemplateFileName = templateFileName;
        }
    }

    public class GameInfo
    {
        public string Name { get; set; }
        public Type Type { get; set; }
        public string ConstructorFileName { get; set; }
        public string TemplateFileName { get; set; }
        public IEnumerable<Type> ActionTypes { get; set; }

        public object ToClient() {
            return new {
                name = Name,
                constructorFileName = ConstructorFileName,
                templateFileName = TemplateFileName
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
                                TemplateFileName = gameDescriptor.TemplateFileName,
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
    }
}