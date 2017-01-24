﻿using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Games
{
    [GameDescriptor("Higher Dice", AutoRestartAfter = 0)]
    public class HigherDice : Game
    {
        public List<PlayerCup> PlayerCups { get; set; }

        public HigherDice(Table table) : base(table) {
            PlayerCups = new List<PlayerCup>(Table.Players.Select(p => new PlayerCup(p)));

            rollDices(PlayerCups);
            var maxDiceValue = PlayerCups.Select(pc => pc.Dices.Last().Value).Max();
            var maxPlayerCups = PlayerCups.Where(pc => pc.Dices.Last().Value == maxDiceValue).ToList();

            while (maxPlayerCups.Count() > 1) {
                rollDices(maxPlayerCups);
                maxDiceValue = maxPlayerCups.Select(pc => pc.Dices.Last().Value).Max();
                maxPlayerCups = PlayerCups.Where(pc => pc.Dices.Last().Value == maxDiceValue).ToList();
            }

            var winnerPlayerCup = maxPlayerCups.First();
            winnerPlayerCup.Dices.Last().IsHighlighted = true;
            Winners.Add(winnerPlayerCup.Player);
            Table.SetNextPlayer(winnerPlayerCup.Player);

            IsEnded = true;
        }

        public override object ToClient() {
            return new {
                playerCups = PlayerCups.Select(pc => pc.ToClient()),
                table = new {
                    activePlayerName = Table.ActivePlayer?.Name,
                },
                isEnded = IsEnded,
                winnerNames = Winners.Select(p => p.Name)
            };
        }

        private void rollDices(List<PlayerCup> playerCups) {
            foreach (var playerCup in playerCups) {
                playerCup.Dices.Add(new Dice(true) { IsExposed = true });
            }
        }
    }
}