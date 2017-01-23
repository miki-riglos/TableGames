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
        public LockStatus LockStatus { get; set; }

        public DoubtPlayerCup(Player player, DoubtPlayerBag playerBag) : base(player) {
            Dices.AddRange(Enumerable.Range(1, playerBag.DicesQuantity).Select(i => new Dice(true)));
            LockStatus = playerBag.LockStatus;
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