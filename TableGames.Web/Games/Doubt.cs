using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Web.Entities;

namespace TableGames.Web.Games
{
    [GameDescriptor("Doubt", "games/doubt")]
    public class Doubt : Game
    {
        public List<PlayerCup> PlayerCups { get; set; }
        public int Quantity { get; set; }
        public Dice Dice { get; set; }
        public Player DiceLoser { get; private set; }
        public Player DiceWinner { get; private set; }

        public Doubt(Table table) : base(table) {
            PlayerCups = new List<PlayerCup>(getPlayerDicesQty().Select(kvp => new PlayerCup(kvp.Key, kvp.Value)));
            Quantity = 0;
            Dice = new Dice() { IsExposed = true };

            Table.SetNextPlayer();
        }

        public int GetActualQuantity() {
            var actualQuantiy = PlayerCups.SelectMany(pc => pc.Dices).Count(d => d.Value == Dice.Value);
            // add wildcards
            if (Dice.Value > 1) {
                actualQuantiy += PlayerCups.SelectMany(pc => pc.Dices).Count(d => d.Value == 1);
            }
            return actualQuantiy;
        }

        public void SetPlayerDicesQty(Player player, int delta) {
            getPlayerDicesQty()[player] += delta;
            if (delta < 0) {
                DiceLoser = player;
            }
            else {
                DiceWinner = player;
            }
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

        public override object ToStats() {
            return new {
                isFinalized = IsFinalized,
                winnerNames = WinnerNames,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            };
        }
    }

    public class BetAction : IGameAction
    {
        public string Name => "bet";

        private Doubt _doubt;

        public BetAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute(dynamic gameChangeParameters) {
            var quantity = (int)gameChangeParameters.quantity;
            var diceValue = (int)gameChangeParameters.diceValue;

            //TODO: validate parameters

            _doubt.Quantity = quantity;
            _doubt.Dice.Value = diceValue;

            _doubt.Table.SetNextPlayer();

            return new GameChangeResult(new {
                quantity = _doubt.Quantity,
                dice = _doubt.Dice.ToClient(),
                table = new {
                    activePlayerName = _doubt.Table.ActivePlayer.Name
                }
            });
        }
    }

    public class DoubtAction : IGameAction
    {
        public string Name => "doubt";

        private Doubt _doubt;

        public DoubtAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute(dynamic gameChangeParameters) {
            if (_doubt.Quantity > _doubt.GetActualQuantity()) {
                _doubt.WinnerNames.Add(_doubt.Table.ActivePlayer.Name);
                _doubt.SetPlayerDicesQty(_doubt.Table.GetPreviousPlayer(), -1);
            }
            else {
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, -1);
            }

            _doubt.PlayerCups.ForEach(pc => pc.ExposeDices());
            _doubt.IsFinalized = true;

            return new GameChangeResult(new {
                playerCups = _doubt.PlayerCups.Select(pc => pc.ToClient()),
                table = new {
                    activePlayerName = _doubt.Table.ActivePlayer.Name,
                    stats = _doubt.Table.Games.Select(g => g.ToStats())
                },
                isFinalized = _doubt.IsFinalized,
                winnerNames = _doubt.WinnerNames
            });
        }
    }

    public class MatchAction : IGameAction
    {
        public string Name => "match";

        private Doubt _doubt;

        public MatchAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute(dynamic gameChangeParameters) {
            if (_doubt.Quantity == _doubt.GetActualQuantity()) {
                _doubt.WinnerNames.Add(_doubt.Table.ActivePlayer.Name);
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, 1);
            }
            else {
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, -1);
            }

            _doubt.PlayerCups.ForEach(pc => pc.ExposeDices());
            _doubt.IsFinalized = true;

            return new GameChangeResult(new {
                playerCups = _doubt.PlayerCups.Select(pc => pc.ToClient()),
                table = new {
                    activePlayerName = _doubt.Table.ActivePlayer.Name,
                    stats = _doubt.Table.Games.Select(g => g.ToStats())
                },
                isFinalized = _doubt.IsFinalized,
                winnerNames = _doubt.WinnerNames
            });
        }
    }

    public class PlayerCup
    {
        public Player Player { get; set; }
        public List<Dice> Dices { get; set; }

        public PlayerCup(Player player, int dicesQuantity) {
            Player = player;
            Dices = new List<Dice>(Enumerable.Range(1, dicesQuantity).Select(i => new Dice(true)));
        }

        public void ExposeDices() {
            Dices.ForEach(d => d.IsExposed = true);
        }

        public object ToClient() {
            return new {
                playerName = Player.Name,
                dices = Dices.Select(d => d.ToClient())
            };
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