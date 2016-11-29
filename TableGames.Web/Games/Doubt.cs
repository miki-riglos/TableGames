using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    [GameDescriptor("Doubt", "games/doubt")]
    public class Doubt : Game
    {
        public List<PlayerCup> PlayerCups { get; private set; }
        public int Quantity { get; private set; }
        public int DiceValue { get; private set; }

        public Doubt(Table table) : base(table) {
            // get quantity of dices per player
            Dictionary<Player, int> playerDicesQty;
            if (!Table.Bag.ContainsKey("DicesPerPlayer")) {
                playerDicesQty = Table.Players.ToDictionary(p => p, p => 5);
                Table.Bag.Add("DicesPerPlayer", playerDicesQty);
            }
            else {
                playerDicesQty = (Dictionary<Player, int>)Table.Bag["DicesPerPlayer"];
            }

            // initialize dices per player
            PlayerCups = new List<PlayerCup>();
            PlayerCups.AddRange(playerDicesQty.Select(kvp => new PlayerCup(kvp.Key, kvp.Value)));

            Table.SetNextPlayer();
        }

        private GameChangeResult bet(string playerName, int quantity, int diceValue) {
            if (playerName != Table.ActivePlayer.Name) {
                throw new Exception("Doubt error - It is not your turn.");
            }
            //TODO: validate parameters

            Quantity = quantity;
            DiceValue = diceValue;

            // set next player if not finalized
            if (!IsFinalized) {
                Table.SetNextPlayer();
            }

            return new GameChangeResult(new {
                table = new {
                    activePlayerName = Table.ActivePlayer.Name
                }
            });
        }

        public override GameChangeResult Change(string playerName, string eventName, dynamic gameChangeParameters) {
            if (eventName == "bet") {
                return bet(playerName, (int)gameChangeParameters.quantity, (int)gameChangeParameters.value);
            }
            throw new Exception("Doubt Change error.");
        }

        public override object ToClient() {
            return new {
                playerCups = PlayerCups.Select(pc => pc.ToClient()),
                quantity = Quantity,
                diceValue = DiceValue,
                table = new {
                    activePlayerName = Table.ActivePlayer?.Name,
                },
                isFinalized = IsFinalized,
                winnerNames = WinnerNames
            };
        }

        public override Dictionary<Player, object> GetPlayerGameStates() {
            return PlayerCups.ToDictionary(
                pc => pc.Player,
                pc => (object)new {
                    dices = pc.Dices.Select(d => d.ToClient())
                }
            );
        }


        public class PlayerCup
        {
            public Player Player { get; set; }
            public List<Dice> Dices { get; set; }

            public PlayerCup(Player player, int dicesQuantity) {
                Player = player;
                Dices = new List<Dice>(Enumerable.Range(1, dicesQuantity).Select(i => new Dice()));
                Dices.ForEach(d => d.Throw());
            }

            public object ToClient() {
                return new {
                    playerName = Player.Name,
                    dicesQty = Dices.Count()
                };
            }
        }

    }

    public class Dice
    {
        private Random _random = new Random(Guid.NewGuid().GetHashCode());

        public int Value { get; set; }

        public void Throw() {
            Value = _random.Next(1, 7);
        }

        public object ToClient() {
            return new {
                value = Value
            };
        }
    }
}