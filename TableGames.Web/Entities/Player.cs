using System.Collections.Generic;
using System.Linq;

namespace TableGames.Web.Entities
{
    public class Player
    {
        public string Name { get; set; }
        public string ConnectionId { get; set; }
        //TODO: use ConcurrentDictionary<string, Room>
        public List<Room> Rooms { get; set; }

        public Player(string name, string connectionId) {
            Name = name;
            ConnectionId = connectionId;
            Rooms = new List<Room>();
        }

        public Room AddRoom(string roomName) {
            var room = new Room(roomName, this);
            Rooms.Add(room);
            return room;
        }

        public Room GetRoom(string roomName) {
            return Rooms.First(r => r.Name == roomName);
        }

        public void RemoveRoom(Room room) {
            Rooms.Remove(room);
        }

        public object ToClient() {
            return new {
                name = Name,
                rooms = Rooms.Select(hr => hr.ToClient())
            };
        }

    }
}