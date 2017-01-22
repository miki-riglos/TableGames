using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Games
{
    public enum LockStatus
    {
        Available,
        Locking,
        Unavailable
    }

    public class PlayerCup
    {
        public Player Player { get; set; }
        public List<Dice> Dices { get; set; }
        public LockStatus LockStatus { get; set; }

        public PlayerCup(Player player, int dicesQuantity, LockStatus lockStatus) {
            Player = player;
            Dices = new List<Dice>(Enumerable.Range(1, dicesQuantity).Select(i => new Dice(true)));
            LockStatus = lockStatus;
        }

        public PlayerCup(Player player) {
            Player = player;
            Dices = new List<Dice>();
        }

        public void ExposeDices() {
            Dices.ForEach(d => d.IsExposed = true);
        }

        public object ToClient() {
            return new {
                playerName = Player.Name,
                dices = Dices.Select(d => d.ToClient()),
                lockStatus = LockStatus.ToString()
            };
        }
    }
}