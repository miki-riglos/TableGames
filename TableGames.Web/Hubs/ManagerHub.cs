﻿using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Web.Hubs
{
    public class ManagerHub : Hub
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
                players = _players.Values.Select(p => p.ToClient()),
                gameInfoRegistry = GameInfo.Registry.Select(gi => gi.ToClient())
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

            return new {
                attendedRooms = _players.Values.SelectMany(p => p.Rooms.Values)
                                    .Where(r => r.PlayerAttendees.Any(p => p.Name == userName))
                                    .Select(r => r.ToClient()),
                userSettings = player.UserSettings.ToClient()
            };
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

        public void SaveUserSettings(string userName, UserSettings userSettings) {
            Player player;
            if (_players.TryGetValue(userName, out player)) {
                player.UserSettings = userSettings;
            }
            else {
                throw new HubException("Save User Settings error.");
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
                var userGameState = room.Table?.Game?.GetPlayerGameStates()
                                        .Where(kvp => kvp.Key.Name == userName)
                                        .Select(kvp => kvp.Value)
                                        .FirstOrDefault();
                Clients.All.onRoomEntered(hostName, room.ToClient(), userName, room.Table?.ToClient(), userGameState);
            }
            else {
                Groups.Add(Context.ConnectionId, room.GroupId);
                room.AnonymousAttendees.Add(Context.ConnectionId);
                Clients.All.onRoomEntered(hostName, room.ToClient(), null, null, null);
                // for anonymous attendee
                Clients.Client(Context.ConnectionId).onRoomAttended(hostName, room.ToClient(), room.Table?.ToClient());
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

        // Tables
        public void CreateTable(string hostName, string roomName, string gameName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.CreateTable(gameName);

            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onTableCreated(hostName, roomName, room.Table.ToClient());
            });
        }

        public void JoinTable(string hostName, string roomName, string playerName) {
            var room = _getPlayer(hostName).GetRoom(roomName);
            var player = _getPlayer(playerName);

            if (room.Table.AddPlayer(player)) {
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onPlayerJoinedTable(hostName, roomName, playerName);
                });
            }
        }

        public void LeaveTable(string hostName, string roomName, string playerName) {
            var room = _getPlayer(hostName).GetRoom(roomName);
            var player = _getPlayer(playerName);

            if (room.Table.RemovePlayer(player)) {
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onPlayerLeftTable(hostName, roomName, playerName);
                });
            }
        }

        public void StartTable(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            if (room.Table.Start()) {
                // initial game state
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onTableStarted(hostName, roomName, room.Table.Token, room.Table.ToClient());
                });

                // initial players state
                foreach (var kvp in room.Table.Game.GetPlayerGameStates()) {
                    Clients.Group(kvp.Key.Name).onUserGameStarted(hostName, roomName, kvp.Value);
                }
            }
        }

        // ... Games
        public void ChangeGame(string hostName, string roomName, int tableToken, string playerName, string actionName, JObject gameChangeParameters) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            if (!room.Table.IsValidToken(tableToken)) {
                return;
            }

            var gameChangeResult = room.Table.ChangeGame(playerName, actionName, gameChangeParameters);

            // game state
            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onGameChanged(hostName, roomName, room.Table.Token, playerName, actionName, gameChangeResult.GameState);
            });

            // players state
            foreach (var kvp in gameChangeResult.PlayerGameStates) {
                Clients.Group(kvp.Key.Name).onUserGameChanged(hostName, roomName, actionName, kvp.Value);
            }
        }

        public void RestartGame(string hostName, string roomName, int tableToken) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            if (!room.Table.IsValidToken(tableToken)) {
                return;
            }

            if (room.Table.Start()) {
                // initial game state
                room.GetGroups().ForEach(groupId => {
                    Clients.Group(groupId).onGameRestarted(hostName, roomName, room.Table.Token, room.Table.ToClient());
                });

                // initial players state
                foreach (var kvp in room.Table.Game.GetPlayerGameStates()) {
                    Clients.Group(kvp.Key.Name).onUserGameStarted(hostName, roomName, kvp.Value);
                }
            }
        }

        public void DestroyTable(string hostName, string roomName) {
            var room = _getPlayer(hostName).GetRoom(roomName);  // will throw if player is not host

            room.DestroyTable();

            room.GetGroups().ForEach(groupId => {
                Clients.Group(groupId).onTableDestroyed(hostName, roomName);
            });
        }
    }
}