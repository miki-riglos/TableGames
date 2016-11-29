using System.Collections.Generic;

namespace TableGames.Web.Entities
{
    public abstract class Game
    {
        public Table Table { get; private set; }
        public bool IsFinalized { get; protected set; }
        public List<string> WinnerNames { get; protected set; }

        public Game(Table table) {
            Table = table;
            WinnerNames = new List<string>();
            IsFinalized = false;
        }

        public abstract GameChangeResult Change(string playerName, string eventName, object gameChangeParameters);

        public abstract object ToClient();

        public virtual Dictionary<Player, object> GetPlayerGameStates() {
            return new Dictionary<Player, object>();
        }

        public virtual object ToStats() {
            return new {
                isFinalized = IsFinalized,
                winnerNames = WinnerNames
            };
        }
    }

    public class GameChangeResult
    {
        public object GameState { get; set; }
        public Dictionary<Player, object> PlayerGameStates { get; set; }

        public GameChangeResult(object gameState) {
            GameState = gameState;
            PlayerGameStates = new Dictionary<Player, object>();
        }

        public GameChangeResult(object gameState, Dictionary<Player, object> playerGameStates) {
            GameState = gameState;
            PlayerGameStates = playerGameStates;
        }
    }
}