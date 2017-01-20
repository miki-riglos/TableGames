namespace TableGames.Games.TicTacToe
{
    public class Box
    {
        public int Row { get; set; }
        public int Col { get; set; }
        public int Id { get { return Row * 10 + Col; } }

        public Box(int row, int col) {
            Row = row;
            Col = col;
        }
    }
}