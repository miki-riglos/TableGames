using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    public class TicTacToe : Game
    {
        private IEnumerable<Box> _board;

        public TicTacToe(Table table) : base(table) {
            _board = createBoard();
        }

        private IEnumerable<Box> createBoard() {
            int[] indices = { 1, 2, 3 };
            return indices.SelectMany(row => indices, (row, col) => new Box(row, col));
        }

        public object AssignBox(string playerName, int row, int column) {
            var box = _board.First(b => b.Row == row && b.Column == column);
            if (box != null && box.PlayerName == null) {
                box.PlayerName = playerName;

                return new { row, column, playerName };
            }
            else {
                throw new Exception("TicTacToe AssignBox error.");
            }
        }

        public override object Change(string playerName, string eventName, dynamic gameChangeParameters) {
            if (eventName == "AssignBox") {
                return AssignBox(playerName, (int)gameChangeParameters.row, (int)gameChangeParameters.column);
            }
            throw new Exception("TicTacToe Change error.");
        }

        public override object ToClient() {
            return new {
                board = _board.Select(b => b.ToClient())
            };
        }

        private class Box
        {
            public int Row { get; set; }
            public int Column { get; set; }
            public string PlayerName { get; set; }

            public Box(int row, int column) {
                Row = row;
                Column = column;
            }

            public object ToClient() {
                return new {
                    row = Row,
                    column = Column,
                    playerName = PlayerName
                };
            }

        }
    }
}