﻿using System;
using System.Collections.Concurrent;
using System.Linq;

namespace TableGames.Web.Entities
{
    public class Player
    {
        public string Name { get; set; }
        public string ConnectionId { get; set; }
        public ConcurrentDictionary<string, Room> Rooms { get; set; }

        public Player(string name, string connectionId) {
            Name = name;
            ConnectionId = connectionId;
            Rooms = new ConcurrentDictionary<string, Room>();
        }

        public Room AddRoom(string roomName) {
            var room = new Room(roomName, this);

            if (Rooms.TryAdd(room.Name, room)) {
                return room;
            }
            else {
                throw new Exception("Player AddRoom error.");
            }
        }

        public Room GetRoom(string roomName) {
            Room room;
            if (Rooms.TryGetValue(roomName, out room)) {
                return room;
            }
            else {
                throw new Exception("Player GetRoom error.");
            }
        }

        public void RemoveRoom(string roomName) {
            Room room;
            if (Rooms.TryRemove(roomName, out room)) {
                return;
            }
            else {
                throw new Exception("Player RemoveRoom error.");
            }
        }

        public object ToClient() {
            return new {
                name = Name,
                rooms = Rooms.Values.Select(hr => hr.ToClient())
            };
        }

    }
}