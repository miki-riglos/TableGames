using System;
using TableGames.Web.Games;

namespace TableGames.Web.Entities
{
    public abstract class Game
    {
        public Table Table { get; private set; }

        public Player ActivePlayer { get; private set; }

        public Game(Table table) {
            Table = table;
        }

        public void SetNextPlayer() {
            if (ActivePlayer == null) {
                ActivePlayer = Table.Players[0];
            }
            else {
                var activeIndex = Table.Players.IndexOf(ActivePlayer);
                activeIndex = activeIndex < (Table.Players.Count - 1) ? activeIndex + 1 : 0;
                ActivePlayer = Table.Players[activeIndex];
            }
        }

        public abstract object Change(string playerName, string eventName, object gameChangeParameters);

        public abstract object ToClient();
    }

    public class GameInfo
    {
        public string Name { get; set; }
        public Type Type { get; set; }
        public string ConstructorFileName { get; set; }
        public string TemplateFileName { get; set; }

        public object ToClient() {
            return new {
                name = Name,
                constructorFileName = ConstructorFileName,
                templateFileName = TemplateFileName
            };
        }

        public static GameInfo[] GameInfos = new GameInfo[] {
            new GameInfo() {
                Name = "Tic Tac Toe",
                Type = typeof(TicTacToe),
                ConstructorFileName = "games/ticTacToe",
                TemplateFileName = "games/ticTacToe"
            }
        };
    }

}