using Microsoft.AspNet.SignalR;
using System.Collections.Concurrent;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Hubs
{
    public class TableGamesHub : Hub
    {
        private static readonly ConcurrentDictionary<string, Player> _players = new ConcurrentDictionary<string, Player>();

        private static Player _getPlayer(string userName) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
                return player;
            }
            else {
                throw new HubException($"Player {userName} not found.");
            }
        }

        public object GetState() {
            return new {
                players = _players.Values.Where(p => p.Rooms.Any()).Select(p => p.ToClient())
            };
        }

        // Authentication
        public object Login(string userName) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
                Groups.Add(Context.ConnectionId, userName);
                Clients.All.onLoggedIn(userName);
            }
            else {
                player = new Player(userName);
                if (_players.TryAdd(userName, player)) {
                    Groups.Add(Context.ConnectionId, userName);
                    Clients.All.onLoggedIn(userName);
                }
                else {
                    throw new HubException("Login error.");
                }
            }
            var attendedRoom = _players.Values.SelectMany(p => p.Rooms.Values)
                                    .Where(r => r.PlayerAttendees.Any(p => p.Name == userName))
                                    .Select(r => r.ToClient())
                                    .ToList();
            return attendedRoom;
        }

        public void Logout(string userName) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
                Groups.Remove(Context.ConnectionId, userName);
                Clients.All.onLoggedOut(userName);
            }
            else {
                throw new HubException("Logout error.");
            }
        }

        // Chat
        public void SendMessage(string userName, string message) {
            Clients.All.onMessageSent(userName, message);
        }

        // Rooms
        public void AddRoom(string userName, string roomName) {
            var player = _getPlayer(userName);
            var room = player.AddRoom(roomName);

            Clients.All.onRoomAdded(userName, room.ToClient());
        }

        public void RemoveRoom(string userName, string roomName) {
            var player = _getPlayer(userName);
            var room = player.GetRoom(roomName);    // will throw if player is not host

            foreach (var attendee in room.AnonymousAttendees) {
                Groups.Remove(attendee, room.GroupId);
            }
            room.AnonymousAttendees.Clear();
            room.PlayerAttendees.Clear();
            player.RemoveRoom(roomName);

            Clients.All.onRoomRemoved(userName, room.ToClient());
        }

        public void EnterRoom(string hostName, string roomName, string userName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            if (userName != null) {
                var playerAttendee = _getPlayer(userName);
                if (!room.PlayerAttendees.Contains(playerAttendee)) {
                    room.PlayerAttendees.Add(playerAttendee);
                }
                Clients.All.onRoomEntered(hostName, room.ToClient(), userName, room.Game?.ToClient());
            }
            else {
                Groups.Add(Context.ConnectionId, room.GroupId);
                room.AnonymousAttendees.Add(Context.ConnectionId);
                Clients.All.onRoomEntered(hostName, room.ToClient(), null, null);
                // for anonymous attendee
                Clients.Client(Context.ConnectionId).onRoomAttended(hostName, room.ToClient(), room.Game?.ToClient());
            }
        }

        public void SendRoomMessage(string hostName, string roomName, string userName, string message) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host
            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onRoomMessageSent(hostName, roomName, userName, message);
            });
        }

        public void LeaveRoom(string hostName, string roomName, string userName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            if (userName != null) {
                var playerAttendee = _getPlayer(userName);
                if (room.PlayerAttendees.Contains(playerAttendee)) {
                    room.PlayerAttendees.Remove(playerAttendee);
                    Clients.All.onRoomLeft(hostName, room.ToClient(), userName);
                }
            }
            else {
                if (room.AnonymousAttendees.Contains(Context.ConnectionId)) {
                    Groups.Remove(Context.ConnectionId, room.GroupId);
                    room.AnonymousAttendees.Remove(Context.ConnectionId);
                    Clients.All.onRoomLeft(hostName, room.ToClient(), null);
                    // for anonymous attendee
                    Clients.Client(Context.ConnectionId).onRoomUnattended(hostName, room.ToClient());
                }
            }
        }

        // Games
        public void CreateGame(string hostName, string roomName, string gameName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.CreateGame(gameName);

            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onGameCreated(hostName, roomName, room.Game.ToClient());
            });
        }

        public void JoinGame(string hostName, string roomName, string playerName) {
            var room = _getPlayer(hostName).GetRoom(roomName);
            var player = _getPlayer(playerName);

            if (!room.Game.Players.Contains(player)) {
                room.Game.AddPlayer(player);
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onGamePlayerJoined(hostName, roomName, playerName);
                });
            }
            else {
                throw new HubException("JoinGame error.");
            }
        }

        public void LeaveGame(string hostName, string roomName, string playerName) {
            var room = _getPlayer(hostName).GetRoom(roomName);
            var player = _getPlayer(playerName);

            if (room.Game.Players.Contains(player) && room.Game.Status == GameStatus.Open) {
                room.Game.RemovePlayer(player);
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onGamePlayerLeft(hostName, roomName, playerName);
                });
            }
            else {
                throw new HubException("LeaveGame error.");
            }
        }

        public void StartGame(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.Game.Start();

            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onGameStarted(hostName, roomName, room.Game.ToClient());
            });
        }

        public void DestroyGame(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.Game = null;

            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onGameDestroyed(hostName, roomName);
            });
        }
    }
}