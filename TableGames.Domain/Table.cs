using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Domain
{
    public enum TableStatus
    {
        Open,
        Started,
        Ended
    }

    public class Table
    {
        public string GameName { get; private set; }
        public string InstanceGameName { get; private set; }
        public TableStatus Status { get; private set; }
        public List<Player> Players { get; private set; }
        public Player ActivePlayer { get; private set; }
        public Room Room { get; private set; }
        public Game Game { get; private set; }
        public List<Game> Games { get; private set; }
        public List<Player> Winners { get; protected set; }
        public Dictionary<string, object> Bag { get; private set; }

        public Table(string gameName, Room room) {
            GameName = gameName;
            Status = TableStatus.Open;
            Players = new List<Player>();
            Room = room;
            Games = new List<Game>();
            Winners = new List<Player>();
            Bag = new Dictionary<string, object>();
        }

        public void AddPlayer(Player player) {
            Players.Add(player);
        }

        public void RemovePlayer(Player player) {
            Players.Remove(player);
        }

        public void Start() {
            InstanceGameName = GameName;
            if (Status != TableStatus.Started) {
                var initialGameType = GameInfo.Registry.FirstOrDefault(gi => gi.Name == GameName)?.InitialGameType;
                if (initialGameType != null) {
                    InstanceGameName = GameInfo.Registry.First(gi => gi.Type == initialGameType).Name;
                }
            }
            if (Status == TableStatus.Ended) {
                ActivePlayer = null;
                Winners = new List<Player>();
                Bag = new Dictionary<string, object>();
            }
            Status = TableStatus.Started;
            Game = GameInfo.CreateGame(InstanceGameName, this);
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
                if (Game.IsEliminated(ActivePlayer)) {
                    SetNextPlayer();
                }
            }
        }

        public void SetNextPlayer(Player player) {
            ActivePlayer = player;
        }

        public Player GetPreviousPlayer(Player player) {
            Player previousPlayer = null;
            if (player != null) {
                var previousIndex = Players.IndexOf(player);
                previousIndex = previousIndex >= 1 ? previousIndex - 1 : Players.Count - 1;
                previousPlayer = Players[previousIndex];
                if (Game.IsEliminated(previousPlayer)) {
                    previousPlayer = GetPreviousPlayer(previousPlayer);
                }
            }
            return previousPlayer;
        }

        public GameChangeResult ChangeGame(string playerName, string actionName, JObject gameChangeParameters) {
            return Game.Change(playerName, actionName, gameChangeParameters);
        }

        public void End(IEnumerable<Player> winners) {
            ActivePlayer = null;
            Status = TableStatus.Ended;
            Winners.AddRange(winners);
        }

        public IEnumerable<object> GetStats() {
            return Games.Select(g => g.ToStats()).Where(s => s != null);
        }

        public object ToClient() {
            return new {
                gameName = GameName,
                instanceGameName = InstanceGameName,
                status = Status.ToString(),
                playerNames = Players.Select(p => p.Name),
                game = Game?.ToClient(),
                stats = GetStats(),
                winnerNames = Winners.Select(p => p.Name)
            };
        }
    }
}