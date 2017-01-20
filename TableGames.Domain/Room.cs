using System.Collections.Generic;
using System.Linq;

namespace TableGames.Domain
{
    public class Room
    {
        public string Name { get; private set; }
        public Player Host { get; private set; }
        public string GroupId { get { return $"{Host.Name}/{Name}"; } }
        public List<string> AnonymousAttendees { get; private set; }
        public List<Player> PlayerAttendees { get; private set; }
        public Table Table { get; private set; }

        public Room(string name, Player host) {
            Name = name;
            Host = host;

            AnonymousAttendees = new List<string>();
            PlayerAttendees = new List<Player>();
        }

        public void CreateTable(string gameName) {
            Table = new Table(gameName, this);
        }

        public void DestroyTable() {
            Table = null;
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