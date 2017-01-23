using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Domain
{
    public abstract class Game
    {
        public Table Table { get; private set; }
        public bool IsInitialGame { get; set; }
        public bool IsEnded { get; set; }
        public List<Player> Winners { get; protected set; }
        public List<GameAction> Actions { get; protected set; }

        public Game(Table table) {
            Table = table;
            Winners = new List<Player>();
            IsEnded = false;
            Actions = new List<GameAction>();
        }

        public GameChangeResult Change(string playerName, string actionName, JObject gameChangeParameters) {
            if (playerName != Table.ActivePlayer.Name) {
                throw new TableGamesException("It is not your turn.");
            }

            var gameAction = Actions.FirstOrDefault(a => a.Name == actionName);

            if (gameAction != null) {
                return gameAction.Execute(gameChangeParameters);
            }
            else {
                throw new TableGamesException("Game Change error.");
            }
        }

        public abstract object ToClient();

        public virtual Dictionary<Player, object> GetPlayerGameStates() {
            return new Dictionary<Player, object>();
        }

        public virtual bool IsEliminated(Player player) {
            return false;
        }

        public virtual object ToStats() {
            return new {
                isEnded = IsEnded,
                winnerNames = Winners.Select(p => p.Name)
            };
        }
    }
}