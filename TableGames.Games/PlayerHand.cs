using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Games
{
    public class PlayerHand
    {
        public Player Player { get; set; }
        public List<Card> Cards { get; set; }

        public PlayerHand(Player player) {
            Player = player;
            Cards = new List<Card>();
        }

        public void ExposeCards() {
            Cards.ForEach(d => d.IsExposed = true);
        }

        public virtual object ToClient() {
            return new {
                playerName = Player.Name,
                cards = Cards.Select(d => d.ToClient()),
            };
        }
    }
}