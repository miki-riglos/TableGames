using System.Collections.Concurrent;
using System.Linq;

namespace TableGames.Domain
{
    public class Player
    {
        public string Name { get; set; }
        public ConcurrentDictionary<string, Room> Rooms { get; set; }

        public Player(string name) {
            Name = name;
            Rooms = new ConcurrentDictionary<string, Room>();
        }

        public Room AddRoom(string roomName) {
            var room = new Room(roomName, this);

            if (Rooms.TryAdd(room.Name, room)) {
                return room;
            }
            else {
                throw new TableGamesException("Player AddRoom error.");
            }
        }

        public Room GetRoom(string roomName) {
            Room room;
            if (Rooms.TryGetValue(roomName, out room)) {
                return room;
            }
            else {
                throw new TableGamesException("Player GetRoom error.");
            }
        }

        public void RemoveRoom(string roomName) {
            Room room;
            if (Rooms.TryRemove(roomName, out room)) {
                return;
            }
            else {
                throw new TableGamesException("Player RemoveRoom error.");
            }
        }

        public object ToClient() {
            return new {
                name = Name,
                rooms = Rooms.Values.Select(r => r.ToClient())
            };
        }

    }
}