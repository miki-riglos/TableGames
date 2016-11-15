using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Games;

namespace TableGames.Web.Entities
{
    public enum TableStatus
    {
        Open,
        Started
    }

    public class Table
    {
        public string GameName { get; private set; }
        public TableStatus Status { get; private set; }
        public List<Player> Players { get; private set; }
        public Player ActivePlayer { get; private set; }
        public Room Room { get; private set; }
        public Game Game { get; private set; }

        public Table(string gameName, Room room) {
            GameName = gameName;
            Status = TableStatus.Open;
            Players = new List<Player>();
            Room = room;
        }

        public void AddPlayer(Player player) {
            Players.Add(player);
        }

        public void RemovePlayer(Player player) {
            Players.Remove(player);
        }

        public void Start() {
            Status = TableStatus.Started;
            Game = new TicTacToe(this);
        }

        public void SetNextPlayer() {
            if (ActivePlayer == null) {
                ActivePlayer = Players[0];
            }
            else {
                var activeIndex = Players.IndexOf(ActivePlayer);
                activeIndex = activeIndex < (Players.Count - 1) ? activeIndex + 1 : 0;
                ActivePlayer = Players[activeIndex];
            }
        }

        public object ChangeGame(string playerName, string eventName, object gameChangeParameters) {
            return Game.Change(playerName, eventName, gameChangeParameters);
        }

        public object ToClient() {
            return new {
                gameName = GameName,
                status = Status.ToString(),
                playerNames = Players.Select(p => p.Name),
                game = Game?.ToClient()
            };
        }
    }
}