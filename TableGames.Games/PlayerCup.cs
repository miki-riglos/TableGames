using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Games
{
    public class PlayerCup
    {
        public Player Player { get; set; }
        public List<Dice> Dices { get; set; }

        public PlayerCup(Player player) {
            Player = player;
            Dices = new List<Dice>();
        }

        public void ExposeDices() {
            Dices.ForEach(d => d.IsExposed = true);
        }

        public virtual object ToClient() {
            return new {
                playerName = Player.Name,
                dices = Dices.Select(d => d.ToClient()),
            };
        }
    }
}