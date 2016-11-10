using System;
using TableGames.Web.Games;

namespace TableGames.Web.Entities
{
    public abstract class Game
    {
        public Table Table { get; private set; }

        public Game(Table table) {
            Table = table;
        }

        public abstract object Change(string playerName, string eventName, object gameChangeParameters);

        public abstract object ToClient();
    }

    public class GameInfo
    {
        public string Name { get; set; }
        public Type Type { get; set; }
        public string TemplateName { get; set; }

        public object ToClient() {
            return new {
                name = Name,
                templateName = TemplateName,
                constructor = "Game"
            };
        }

        public static GameInfo[] GameInfos = new GameInfo[] {
            new GameInfo() { Name = "Tic Tac Toe", Type = typeof(TicTacToe), TemplateName = "gameTemplate" }
        };
    }

}