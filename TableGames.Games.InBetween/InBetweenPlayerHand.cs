using System.Linq;
using TableGames.Domain;

namespace TableGames.Games.InBetween
{
    public class InBetweenPlayerHand : PlayerHand
    {
        private readonly InBetweenPlayerBag _playerBag;

        public int Chips {
            get { return _playerBag.Chips; }
            set { _playerBag.Chips = value; }
        }

        public InBetweenPlayerHand(Player player, InBetweenPlayerBag playerBag) : base(player) {
            _playerBag = playerBag;
        }

        public new object ToClient() {
            return new {
                playerName = Player.Name,
                cards = Cards.Select(c => c.ToClient()),
                chips = Chips
            };
        }
    }
}