﻿using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;
using TableGames.Domain.Extensions;

namespace TableGames.Games.TicTacToe
{
    [GameDescriptor("Tic Tac Toe", MaxPlayers = 2, AutoRestartAfter = 0)]
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
            var client = new {
                board = Board.Select(ab => ab.ToClient()),
                winningBoxes = WinningBoxes.Select(ab => ab.ToClient())
            };
            return client.Merge(base.ToClient());
        }

        public static List<int[]> WinningBoxCombinations = new List<int[]>() {
            new int[] { 11, 12, 13 }, new int[] { 21, 22, 23 }, new int[] { 31, 32, 33 },
            new int[] { 11, 21, 31 }, new int[] { 12, 22, 32 }, new int[] { 13, 23, 33 },
            new int[] { 11, 22, 33 }, new int[] { 13, 22, 31 }
        };
    }

    public class AssignBoxAction : GameAction
    {
        public override string Name => "assignBox";

        private TicTacToe _ticTacToe;

        public AssignBoxAction(TicTacToe ticTacToe) {
            _ticTacToe = ticTacToe;
        }

        public GameChangeResult Execute(int row, int col) {
            var assignedBox = _ticTacToe.Board.First(ab => ab.Box.Row == row && ab.Box.Col == col);
            if (assignedBox != null && assignedBox.PlayerName == null) {
                assignedBox.PlayerName = _ticTacToe.Table.ActivePlayer.Name;

                // check if finalized
                var playerBoxes = _ticTacToe.Board.Where(ab => ab.PlayerName == _ticTacToe.Table.ActivePlayer.Name);
                var winningBoxCombination = TicTacToe.WinningBoxCombinations.FirstOrDefault(ids => ids.Intersect(playerBoxes.Select(ab => ab.Box.Id)).Count() == 3);

                if (winningBoxCombination == null) {
                    _ticTacToe.IsEnded = _ticTacToe.Board.Count(ab => ab.PlayerName != null) >= 9;
                }
                else {
                    _ticTacToe.IsEnded = true;
                    _ticTacToe.WinningBoxes = _ticTacToe.Board.Where(ab => winningBoxCombination.Contains(ab.Box.Id)).ToList();
                    _ticTacToe.Winners.Add(_ticTacToe.Table.ActivePlayer);
                }

                // set next player if not finalized
                if (!_ticTacToe.IsEnded) {
                    _ticTacToe.Table.SetNextPlayer();
                }

                return new GameChangeResult(new {
                    row = row,
                    col = col,
                    table = new {
                        activePlayerName = _ticTacToe.Table.ActivePlayer?.Name,
                        stats = _ticTacToe.Table.GetStats()
                    },
                    isEnded = _ticTacToe.IsEnded,
                    winningBoxes = _ticTacToe.WinningBoxes.Select(ab => ab.ToClient()),
                    winnerNames = _ticTacToe.Winners.Select(p => p.Name)
                });
            }
            else {
                throw new TableGamesException("Invalid action. Box must be unassigned.");
            }
        }
    }
}