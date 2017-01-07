using Microsoft.AspNet.SignalR;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    [GameDescriptor("Tic Tac Toe", "games/ticTacToe")]
    public class TicTacToe : Game
    {
        public List<AssignedBox> Board { get; private set; }
        public List<AssignedBox> WinningBoxes { get; set; }

        public TicTacToe(Table table) : base(table) {
            int[] indices = { 1, 2, 3 };
            Board = indices.SelectMany(row => indices, (row, col) => new AssignedBox(row, col)).ToList();

            WinningBoxes = new List<AssignedBox>();

            Table.SetNextPlayer();
        }

        public override object ToClient() {
            return new {
                board = Board.Select(ab => ab.ToClient()),
                table = new {
                    activePlayerName = Table.ActivePlayer?.Name,
                },
                isFinalized = IsFinalized,
                winningBoxes = WinningBoxes.Select(ab => ab.ToClient()),
                winnerNames = WinnerNames
            };
        }

        public static List<int[]> WinningBoxCombinations = new List<int[]>() {
            new int[] { 11, 12, 13 }, new int[] { 21, 22, 23 }, new int[] { 31, 32, 33 },
            new int[] { 11, 21, 31 }, new int[] { 12, 22, 32 }, new int[] { 13, 23, 33 },
            new int[] { 11, 22, 33 }, new int[] { 13, 22, 31 }
        };
    }

    public class AssignBoxAction : IGameAction
    {
        public string Name => "assignBox";

        private TicTacToe _ticTacToe;

        public AssignBoxAction(TicTacToe ticTacToe) {
            _ticTacToe = ticTacToe;
        }

        public GameChangeResult Execute(dynamic gameChangeParameters) {
            var row = (int)gameChangeParameters.row;
            var col = (int)gameChangeParameters.col;

            var assignedBox = _ticTacToe.Board.First(ab => ab.Box.Row == row && ab.Box.Col == col);
            if (assignedBox != null && assignedBox.PlayerName == null) {
                assignedBox.PlayerName = _ticTacToe.Table.ActivePlayer.Name;

                // check if finalized
                var playerBoxes = _ticTacToe.Board.Where(ab => ab.PlayerName == _ticTacToe.Table.ActivePlayer.Name);
                var winningBoxCombination = TicTacToe.WinningBoxCombinations.FirstOrDefault(ids => ids.Intersect(playerBoxes.Select(ab => ab.Box.Id)).Count() == 3);

                if (winningBoxCombination == null) {
                    _ticTacToe.IsFinalized = _ticTacToe.Board.Count(ab => ab.PlayerName != null) >= 9;
                }
                else {
                    _ticTacToe.IsFinalized = true;
                    _ticTacToe.WinningBoxes = _ticTacToe.Board.Where(ab => winningBoxCombination.Contains(ab.Box.Id)).ToList();
                    _ticTacToe.WinnerNames.Add(_ticTacToe.Table.ActivePlayer.Name);
                }

                // set next player if not finalized
                if (!_ticTacToe.IsFinalized) {
                    _ticTacToe.Table.SetNextPlayer();
                }

                return new GameChangeResult(new {
                    row = row,
                    col = col,
                    table = new {
                        activePlayerName = _ticTacToe.Table.ActivePlayer.Name,
                        stats = _ticTacToe.Table.Games.Select(g => g.ToStats())
                    },
                    isFinalized = _ticTacToe.IsFinalized,
                    winningBoxes = _ticTacToe.WinningBoxes.Select(ab => ab.ToClient()),
                    winnerNames = _ticTacToe.WinnerNames
                });
            }
            else {
                throw new HubException("TicTacToe AssignBox error.");
            }
        }
    }

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