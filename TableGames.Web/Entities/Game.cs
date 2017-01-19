using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace TableGames.Web.Entities
{
    public abstract class Game
    {
        public Table Table { get; private set; }
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

    public abstract class GameAction
    {
        public abstract string Name { get; }

        public virtual GameChangeResult Execute(JObject gameChangeParameters) {
            var methodInfo = this.GetType().GetMethod(nameof(this.Execute), BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
            var parameterInfos = methodInfo.GetParameters();
            var parameterValues = new List<object>();

            foreach (var parameterInfo in parameterInfos) {
                var parameterValue = gameChangeParameters.GetValue(parameterInfo.Name).ToObject(parameterInfo.ParameterType);
                parameterValues.Add(parameterValue);
            }

            var gameChangeResult = (GameChangeResult)methodInfo.Invoke(this, parameterValues.ToArray());
            return gameChangeResult;
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