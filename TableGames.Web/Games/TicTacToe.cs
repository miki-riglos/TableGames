using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    public class TicTacToe : Game
    {
        private List<Box> _board;

        public TicTacToe(Table table) : base(table) {
            SetNextPlayer();
            _board = createBoard();
        }

        private List<Box> createBoard() {
            int[] indices = { 1, 2, 3 };
            return indices.SelectMany(row => indices, (row, col) => new Box(row, col)).ToList();
        }

        public object AssignBox(string playerName, int row, int col) {
            var box = _board.First(b => b.Row == row && b.Col == col);
            if (box != null && box.PlayerName == null) {
                box.PlayerName = playerName;
                SetNextPlayer();

                return new {
                    row = row,
                    col = col,
                    playerName = playerName,
                    activePlayerName = ActivePlayer.Name
                };
            }
            else {
                throw new Exception("TicTacToe AssignBox error.");
            }
        }

        public override object Change(string playerName, string eventName, dynamic gameChangeParameters) {
            if (eventName == "AssignBox") {
                if (playerName == ActivePlayer.Name ) {
                    return AssignBox(playerName, (int)gameChangeParameters.row, (int)gameChangeParameters.col);
                }
                throw new Exception("TicTacToe Change error - It is not your turn.");
            }
            throw new Exception("TicTacToe Change error.");
        }

        public override object ToClient() {
            return new {
                board = _board.Select(b => b.ToClient()),
                activePlayerName = ActivePlayer?.Name
            };
        }

        private class Box
        {
            public int Row { get; set; }
            public int Col { get; set; }
            public string PlayerName { get; set; }

            public Box(int row, int col) {
                Row = row;
                Col = col;
            }

            public object ToClient() {
                return new {
                    row = Row,
                    col = Col,
                    playerName = PlayerName
                };
            }

        }
    }
}