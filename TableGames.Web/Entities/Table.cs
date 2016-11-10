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
        public string GameName { get; set; }
        public TableStatus Status { get; set; }
        public List<Player> Players { get; set; }
        public Game Game { get; set; }

        public Table(string gameName) {
            GameName = gameName;
            Status = TableStatus.Open;
            Players = new List<Player>();
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

        public object ToClient() {
            return new {
                gameName = GameName,
                status = Status.ToString(),
                playerNames = Players.Select(p => p.Name)
            };
        }
    }
}