﻿using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;
using TableGames.Domain.Extensions;

namespace TableGames.Games
{
    [GameDescriptor("Higher Card", AutoRestartAfter = 0)]
    public class HigherCard : Game
    {
        public Deck Deck { get; set; }
        public List<PlayerHand> PlayerHands { get; set; }

        public HigherCard(Table table) : base(table) {
            Deck = new Deck();
            PlayerHands = new List<PlayerHand>(Table.Players.Select(p => new PlayerHand(p)));

            dealCards(PlayerHands);
            var maxCardValue = PlayerHands.Select(pc => pc.Cards.Last().Value).Max();
            var maxPlayerHands = PlayerHands.Where(pc => pc.Cards.Last().Value == maxCardValue).ToList();

            while (maxPlayerHands.Count() > 1) {
                dealCards(maxPlayerHands);
                maxCardValue = maxPlayerHands.Select(pc => pc.Cards.Last().Value).Max();
                maxPlayerHands = PlayerHands.Where(pc => pc.Cards.Last().Value == maxCardValue).ToList();
            }

            var winnerPlayerHand = maxPlayerHands.First();
            winnerPlayerHand.Cards.Last().IsHighlighted = true;
            Winners.Add(winnerPlayerHand.Player);
            Table.SetNextPlayer(winnerPlayerHand.Player);

            IsEnded = true;
        }

        public override object ToClient() {
            var client = new {
                playerHands = PlayerHands.Select(pc => pc.ToClient()),
            };
            return client.Merge(base.ToClient());
        }

        private void dealCards(List<PlayerHand> playerHands) {
            foreach (var playerHand in playerHands) {
                var card = Deck.Deal();
                card.IsExposed = true;
                playerHand.Cards.Add(card);
            }
        }
    }
}