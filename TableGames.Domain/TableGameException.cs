using System;

namespace TableGames.Domain
{
    public class TableGamesException : Exception
    {
        public TableGamesException(string message) : base(message) {
        }
    }
}
