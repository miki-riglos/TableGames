namespace TableGames.Games.TicTacToe
{
    public class AssignedBox
    {
        public Box Box { get; set; }
        public string PlayerName { get; set; }

        public AssignedBox(int row, int col) {
            Box = new Box(row, col);
        }

        public object ToClient() {
            return new {
                row = Box.Row,
                col = Box.Col,
                playerName = PlayerName
            };
        }
    }
}