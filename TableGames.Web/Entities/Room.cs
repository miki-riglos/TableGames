using System.Collections.Generic;
using System.Linq;

namespace TableGames.Web.Entities
{
    public class Room
    {
        public string Name { get; set; }
        public Player Host { get; set; }
        public string GroupId { get { return $"{Host.Name}/{Name}"; } }
        public List<string> AnonymousAttendees { get; set; }
        public List<Player> PlayerAttendees { get; set; }
        public Game Game { get; set; }

        public Room(string name, Player host) {
            Name = name;
            Host = host;

            AnonymousAttendees = new List<string>();
            PlayerAttendees = new List<Player>();
        }

        public void CreateGame(string gameName) {
            Game = new Game(gameName);
        }

        public List<string> GetGroups() {
            var groups = new List<string>();
            groups.Add(Host.Name);
            groups.Add(GroupId);    // anonymous attendees are in this group
            groups.AddRange(PlayerAttendees.Select(p => p.Name));
            return groups.Distinct().ToList();
        }

        public object ToClient() {
            return new {
                name = Name,
                hostName = Host.Name,
                attendance = AnonymousAttendees.Count + PlayerAttendees.Count
            };
        }
    }
}