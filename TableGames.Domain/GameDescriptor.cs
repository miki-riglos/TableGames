using System;

namespace TableGames.Domain
{
    [AttributeUsage(AttributeTargets.Class)]
    public class GameDescriptorAttribute : Attribute
    {
        public string Name { get; set; }
        public string ConstructorFileName { get; set; }
        public Type InitialGameType { get; set; }
        public bool IsTableGame { get; set; }

        public GameDescriptorAttribute(string name) {
            Name = name;
            ConstructorFileName = (name.Substring(0, 1).ToLower() + name.Substring(1)).Replace(" ", string.Empty);
            IsTableGame = true;
        }
    }
}