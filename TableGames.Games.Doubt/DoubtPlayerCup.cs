using System.Linq;
using TableGames.Domain;

namespace TableGames.Games.Doubt
{
    public enum LockStatus
    {
        Available,
        Locking,
        Unavailable
    }

    public class DoubtPlayerCup : PlayerCup
    {
        private readonly DoubtPlayerBag _playerBag;

        public LockStatus LockStatus {
            get { return _playerBag.LockStatus; }
            set { _playerBag.LockStatus = value; }
        }

        public int DicesQuantity {
            get { return _playerBag.DicesQuantity; }
            set { _playerBag.DicesQuantity = value; }
        }
       
        public DoubtPlayerCup(Player player, DoubtPlayerBag playerBag) : base(player) {
            _playerBag = playerBag;

            Dices.AddRange(Enumerable.Range(1, playerBag.DicesQuantity).Select(i => new Dice(true)));
        }

        public new object ToClient() {
            return new {
                playerName = Player.Name,
                dices = Dices.Select(d => d.ToClient()),
                lockStatus = LockStatus.ToString()
            };
        }
    }
}