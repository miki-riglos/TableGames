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

        public abstract object Change(string playerName, string eventName, object gameChangeParameters);

        public abstract object ToClient();

        public virtual object ToStats() {
            return new {
                isFinalized = IsFinalized,
                winnerNames = WinnerNames
            };
        }
    }
}