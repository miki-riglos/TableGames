using System.Collections.Generic;

namespace TableGames.Web.Entities
{
    public class Room
    {
        public string Name { get; set; }
        public Player Host { get; set; }
        public string GroupId { get { return $"{Host.Name}/{Name}"; } }
        public List<string> Attendees { get; set; }
        public Game Game { get; set; }

        public Room(string name, Player host) {
            Name = name;
            Host = host;

            Attendees = new List<string>();
        }

        public void CreateGame(string gameName) {
            Game = new Game(gameName);
        }

        public object ToClient() {
            return new {
                name = Name,
                hostName = Host.Name,
                attendance = Attendees.Count
            };
        }
    }
}