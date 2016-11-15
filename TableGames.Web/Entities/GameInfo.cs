using System;
using TableGames.Web.Games;

namespace TableGames.Web.Entities
{
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