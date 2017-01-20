using System;

namespace TableGames.Domain
{
    [AttributeUsage(AttributeTargets.Class)]
    public class GameDescriptorAttribute : Attribute
    {
        public string Name { get; set; }
        public string ConstructorFileName { get; set; }

        public GameDescriptorAttribute(string name, string constructorFileName) {
            Name = name;
            ConstructorFileName = constructorFileName;
        }
    }
}