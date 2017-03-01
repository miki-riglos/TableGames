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
        public int MinPlayers { get; set; }
        public int MaxPlayers { get; set; }
        public int AutoStartAfter { get; set; }
        public int AutoRestartAfter { get; set; }
        public string UrlName { get { return Name.Replace(" ", string.Empty); } }

        public GameDescriptorAttribute() { }
        public GameDescriptorAttribute(string name) {
            Name = name;
            ConstructorFileName = (name.Substring(0, 1).ToLower() + name.Substring(1)).Replace(" ", string.Empty);
            IsTableGame = true;
            MinPlayers = 2;
            MaxPlayers = 10;
            AutoStartAfter = 3;
            AutoRestartAfter = 30;
        }
    }
}