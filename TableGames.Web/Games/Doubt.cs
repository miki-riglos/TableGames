﻿using System;
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
        public Dice Dice { get; private set; }

        public Doubt(Table table) : base(table) {
            PlayerCups = new List<PlayerCup>(getPlayerDicesQty().Select(kvp => new PlayerCup(kvp.Key, kvp.Value)));
            Quantity = 0;
            Dice = new Dice() { IsExposed = true };

            Table.SetNextPlayer();
        }

        private GameChangeResult bet(string playerName, int quantity, int diceValue) {
            if (playerName != Table.ActivePlayer.Name) {
                throw new Exception("Doubt error - It is not your turn.");
            }
            //TODO: validate parameters

            Quantity = quantity;
            Dice.Value = diceValue;

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
                dice = Dice.ToClient(),
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
                    dices = pc.Dices.Select(d => d.GetExposedDice().ToClient())
                }
            );
        }

        private Dictionary<Player, int> getPlayerDicesQty() {
            Dictionary<Player, int> playerDicesQty;
            if (!Table.Bag.ContainsKey("DicesPerPlayer")) {
                playerDicesQty = Table.Players.ToDictionary(p => p, p => 5);
                Table.Bag.Add("DicesPerPlayer", playerDicesQty);
            }
            else {
                playerDicesQty = (Dictionary<Player, int>)Table.Bag["DicesPerPlayer"];
            }

            return playerDicesQty;
        }

        public class PlayerCup
        {
            public Player Player { get; set; }
            public List<Dice> Dices { get; set; }

            public PlayerCup(Player player, int dicesQuantity) {
                Player = player;
                Dices = new List<Dice>(Enumerable.Range(1, dicesQuantity).Select(i => new Dice(true)));
            }

            public object ToClient() {
                return new {
                    playerName = Player.Name,
                    dices = Dices.Select(d => d.ToClient())
                };
            }
        }
    }

    public class Dice
    {
        private Random _random = new Random(Guid.NewGuid().GetHashCode());

        public bool IsExposed { get; set; }
        public int Value { get; set; }

        public Dice(bool throwDice = false) {
            IsExposed = false;
            if (throwDice) {
                Throw();
            }
        }

        public void Throw() {
            Value = _random.Next(1, 7);
        }

        public Dice GetExposedDice() {
            var exposedDice = new Dice();
            exposedDice.IsExposed = true;
            exposedDice.Value = Value;
            return exposedDice;
        }

        public object ToClient() {
            return new {
                isExposed = IsExposed,
                value = IsExposed ? Value : 0
            };
        }
    }
}