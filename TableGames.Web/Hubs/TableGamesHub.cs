﻿using Microsoft.AspNet.SignalR;
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

        private static Player _getPlayerByConnectionId(string connectionId) {
            return _players.Values.FirstOrDefault(p => p.ConnectionId == connectionId);
        }

        public object GetState() {
            return new {
                players = _players.Values.Select(p => p.ToClient())
            };
        }

        // Authentication
        public void Login(string userName) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
                // player already exists
                // ... logout in old session
                Clients.Client(player.ConnectionId).playerLogout();
                // ... login in new session
                player.ConnectionId = Context.ConnectionId;
                Clients.All.onPlayerLoggedIn(player.ToClient());
            }
            else {
                player = new Player(userName, Context.ConnectionId);
                if (_players.TryAdd(userName, player)) {
                    Clients.All.onLoggedIn(userName);
                }
                else {
                    throw new HubException("Login error.");
                }
            }
        }

        public void Logout(string userName) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
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

            Groups.Add(player.ConnectionId, room.GroupId);

            Clients.All.onRoomAdded(userName, room.ToClient());
        }

        public void RemoveRoom(string userName, string roomName) {
            var player = _getPlayer(userName);
            if (player.ConnectionId == Context.ConnectionId) {
                var room = player.GetRoom(roomName);

                foreach (var attendee in room.Attendees) {
                    Groups.Remove(attendee, room.GroupId);
                }
                room.Attendees.Clear();
                player.RemoveRoom(roomName);

                Clients.All.onRoomRemoved(userName, room.ToClient());
            }
            else {
                throw new HubException("RemoveRoom error.");
            }
        }

        public object EnterRoom(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);

            if (!room.Attendees.Contains(Context.ConnectionId)) {
                var attendeePlayer = _getPlayerByConnectionId(Context.ConnectionId);

                Groups.Add(Context.ConnectionId, room.GroupId);
                room.Attendees.Add(Context.ConnectionId);

                Clients.All.onRoomEntered(hostName, room.ToClient(), attendeePlayer?.Name);

                return room.Game?.ToClient();
            }
            else {
                throw new HubException("EnterRoom error.");
            }
        }

        public void LeaveRoom(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);

            if (room.Attendees.Contains(Context.ConnectionId)) {
                var attendeePlayer = _getPlayerByConnectionId(Context.ConnectionId);

                Groups.Remove(Context.ConnectionId, room.GroupId);
                room.Attendees.Remove(Context.ConnectionId);

                Clients.All.onRoomLeft(hostName, room.ToClient(), attendeePlayer?.Name);
            }
            else {
                throw new HubException("LeaveRoom error.");
            }
        }

        // Games
        public void CreateGame(string hostName, string roomName, string gameName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.CreateGame(gameName);

            Clients.Group(room.GroupId).onGameCreated(hostName, roomName, room.Game.ToClient());
        }

        public void JoinGame(string hostName, string roomName, string playerName) {
            var room = _getPlayer(hostName).GetRoom(roomName);
            var player = _getPlayer(playerName);

            if (!room.Game.Players.Contains(player)) {
                room.Game.AddPlayer(player);
                Clients.Group(room.GroupId).onGamePlayerJoined(hostName, roomName, playerName);
            }
            else {
                throw new HubException("JoinGame error.");
            }
        }

        public void StartGame(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.Game.Start();

            Clients.Group(room.GroupId).onGameStarted(hostName, roomName, room.Game.ToClient());
        }

        public void DestroyGame(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.Game = null;

            Clients.Group(room.GroupId).onGameDestroyed(hostName, roomName);
        }
    }
}