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
}