using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Games;

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

        public object ToClient() {
            return new {
                name = Name,
                constructorFileName = ConstructorFileName,
                templateFileName = TemplateFileName
            };
        }

        private static Lazy<IEnumerable<GameInfo>> _registry = new Lazy<IEnumerable<GameInfo>>(() => {
            return AppDomain.CurrentDomain.GetAssemblies()
                        .SelectMany(a => a.GetTypes())
                        .Where(type => typeof(Game).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                        .Select(type => {
                            var gameDescriptor = (GameDescriptorAttribute)type.GetCustomAttributes(typeof(GameDescriptorAttribute), false).FirstOrDefault();
                            return new GameInfo() {
                                Name = gameDescriptor.Name,
                                Type = typeof(TicTacToe),
                                ConstructorFileName = gameDescriptor.ConstructorFileName,
                                TemplateFileName = gameDescriptor.TemplateFileName
                            };

                        });
        });

        public static IEnumerable<GameInfo> Registry => _registry.Value;

        public static Game CreateGame(string gameName, Table table) {
            var gameType = Registry.First(gi => gi.Name == gameName).Type;
            return (Game)Activator.CreateInstance(gameType, table);
        }

    }
}