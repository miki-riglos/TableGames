using Microsoft.AspNet.SignalR;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Web.Entities
{
    public abstract class Game
    {
        public Table Table { get; private set; }
        public bool IsEnded { get; set; }
        public List<Player> Winners { get; protected set; }
        public List<IGameAction> Actions { get; protected set; }

        public Game(Table table) {
            Table = table;
            Winners = new List<Player>();
            IsEnded = false;
            Actions = new List<IGameAction>();
        }

        public GameChangeResult Change(string playerName, string actionName, object gameChangeParameters) {
            if (playerName != Table.ActivePlayer.Name) {
                throw new HubException("It is not your turn.");
            }

            var gameAction = Actions.FirstOrDefault(a => a.Name == actionName);

            if (gameAction != null) {
                return gameAction.Execute(gameChangeParameters);
            }
            else {
                throw new HubException("Game Change error.");
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

    public interface IGameAction
    {
        string Name { get; }
        GameChangeResult Execute(object gameChangeParameters);
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