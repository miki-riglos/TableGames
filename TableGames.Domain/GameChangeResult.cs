using System.Collections.Generic;

namespace TableGames.Domain
{
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