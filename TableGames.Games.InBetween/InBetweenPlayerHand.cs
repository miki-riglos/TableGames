using System.Linq;
using TableGames.Domain;

namespace TableGames.Games.InBetween
{
    public class InBetweenPlayerHand : PlayerHand
    {
        private readonly InBetweenPlayerBag _playerBag;

        public int ChipsPurchased {
            get { return _playerBag.Chips.Amount; }
            set { _playerBag.Chips.Amount = value; }
        }

        public int ChipsBalance {
            get { return _playerBag.Chips.Balance; }
            set { _playerBag.Chips.Balance = value; }
        }

        public InBetweenPlayerHand(Player player, InBetweenPlayerBag playerBag) : base(player) {
            _playerBag = playerBag;
        }

        public new object ToClient() {
            return new {
                playerName = Player.Name,
                cards = Cards.Select(c => c.ToClient()),
                chipsPurchased = ChipsPurchased,
                chipsBalance = ChipsBalance
            };
        }
    }
}