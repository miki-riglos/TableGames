using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    public class TicTacToe : Game
    {
        public List<AssignedBox> Board { get; private set; }
        public bool IsFinalized { get; private set; }
        public List<AssignedBox> WinningBoxes { get; private set; }
        public string WinnerName { get; private set; }

        public TicTacToe(Table table) : base(table) {
            Board = createBoard();
            IsFinalized = false;
            WinningBoxes = new List<AssignedBox>();
            WinnerName = null;

            SetNextPlayer();
        }

        private List<AssignedBox> createBoard() {
            int[] indices = { 1, 2, 3 };
            return indices.SelectMany(row => indices, (row, col) => new AssignedBox(row, col)).ToList();
        }

        private object assignBox(int row, int col) {
            var assignedBox = Board.First(ab => ab.Box.Row == row && ab.Box.Col == col);
            if (assignedBox != null && assignedBox.PlayerName == null) {
                assignedBox.PlayerName = ActivePlayer.Name;

                updateState();

                if (!IsFinalized) {
                    SetNextPlayer();
                }

                return new {
                    row = row,
                    col = col,
                    activePlayerName = ActivePlayer.Name,
                    isFinalized = IsFinalized,
                    winningBoxes = WinningBoxes.Select(ab => ab.ToClient()),
                    winnerName = WinnerName
                };
            }
            else {
                throw new Exception("TicTacToe AssignBox error.");
            }
        }

        private void updateState() {
            var playerBoxes = Board.Where(ab => ab.PlayerName == ActivePlayer.Name);
            var winningBoxCombination = _winningBoxCombinations.FirstOrDefault(ids => ids.Intersect(playerBoxes.Select(ab => ab.Box.Id)).Count() == 3);

            if (winningBoxCombination == null) {
                IsFinalized = Board.Count(ab => ab.PlayerName != null) >= 9;
            }
            else {
                IsFinalized = true;
                WinningBoxes = Board.Where(ab => winningBoxCombination.Contains(ab.Box.Id)).ToList();
                WinnerName = ActivePlayer.Name;
            }
        }

        public override object Change(string playerName, string eventName, dynamic gameChangeParameters) {
            if (eventName == "assignBox") {
                if (playerName == ActivePlayer.Name) {
                    return assignBox((int)gameChangeParameters.row, (int)gameChangeParameters.col);
                }
                throw new Exception("TicTacToe Change error - It is not your turn.");
            }
            throw new Exception("TicTacToe Change error.");
        }

        public override object ToClient() {
            return new {
                board = Board.Select(ab => ab.ToClient()),
                activePlayerName = ActivePlayer?.Name,
                isFinalized = IsFinalized,
                winningBoxes = WinningBoxes.Select(ab => ab.ToClient()),
                winnerName = WinnerName
            };
        }

        private static List<int[]> _winningBoxCombinations = new List<int[]>() {
            new int[] { 11, 12, 13 }, new int[] { 21, 22, 23 }, new int[] { 31, 32, 33 },
            new int[] { 11, 21, 31 }, new int[] { 12, 22, 32 }, new int[] { 13, 23, 33 },
            new int[] { 11, 22, 33 }, new int[] { 13, 22, 31 }
        };

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
}