using System.Collections.Generic;
using System.Linq;

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
        public List<Game> Games { get; private set; }
        public Dictionary<string, object> Bag { get; private set; }

        public Table(string gameName, Room room) {
            GameName = gameName;
            Status = TableStatus.Open;
            Players = new List<Player>();
            Room = room;
            Games = new List<Game>();
            Bag = new Dictionary<string, object>();
        }

        public void AddPlayer(Player player) {
            Players.Add(player);
        }

        public void RemovePlayer(Player player) {
            Players.Remove(player);
        }

        public void Start() {
            Status = TableStatus.Started;
            Game = GameInfo.CreateGame(GameName, this);
            Games.Add(Game);
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

        public GameChangeResult ChangeGame(string playerName, string actionName, object gameChangeParameters) {
            return Game.Change(playerName, actionName, gameChangeParameters);
        }

        public object ToClient() {
            return new {
                gameName = GameName,
                status = Status.ToString(),
                playerNames = Players.Select(p => p.Name),
                game = Game?.ToClient(),
                stats = Games.Select(g => g.ToStats())
            };
        }
    }
}