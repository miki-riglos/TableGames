using System.Collections.Generic;
using System.Linq;

namespace TableGames.Web.Entities
{
    public enum GameStatus
    {
        Open,
        Started
    }

    public class Game
    {
        public string Name { get; set; }
        public GameStatus Status { get; set; }
        public List<Player> Players { get; set; }

        public Game(string name) {
            Name = name;
            Status = GameStatus.Open;
            Players = new List<Player>();
        }

        public void AddPlayer(Player player) {
            Players.Add(player);
        }

        public void RemovePlayer(Player player) {
            Players.Remove(player);
        }

        public void Start() {
            Status = GameStatus.Started;
        }

        public object ToClient() {
            return new {
                name = Name,
                status = Status.ToString(),
                playerNames = Players.Select(p => p.Name)
            };
        }
    }
}