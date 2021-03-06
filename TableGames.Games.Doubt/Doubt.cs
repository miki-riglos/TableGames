﻿using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;
using TableGames.Domain.Extensions;

namespace TableGames.Games.Doubt
{
    [GameDescriptor("Doubt", InitialGameType = typeof(HigherDice))]
    public class Doubt : Game
    {
        public List<DoubtPlayerCup> PlayerCups { get; set; }
        public int Quantity { get; set; }
        public Dice Dice { get; set; }
        public bool HasLock { get; set; }
        public GameAction EndAction { get; private set; }
        public Player DiceLoser { get; private set; }
        public Player DiceWinner { get; private set; }
        public bool HasBet { get { return Dice.Value > 0; } }
        public int ActualQuantity { get { return PlayerCups.SelectMany(pc => pc.Dices).Count(d => d.Value == Dice.Value || d.Value == 1); } }

        public Doubt(Table table) : base(table) {
            HasLock = false;

            var playerBags = Table.GetBagItem("PlayerBags", () => Table.Players.ToDictionary(
                p => p,
                p => new DoubtPlayerBag() { DicesQuantity = 5, LockStatus = LockStatus.Available }
            ));

            // transition lock status
            foreach (var kvp in playerBags) {
                if (kvp.Value.DicesQuantity == 1 && kvp.Value.LockStatus == LockStatus.Available) {
                    kvp.Value.LockStatus = LockStatus.Locking;
                    HasLock = true;
                }
            }

            PlayerCups = new List<DoubtPlayerCup>(playerBags.Select(kvp => new DoubtPlayerCup(kvp.Key, kvp.Value)));

            Quantity = 0;
            Dice = new Dice() { IsExposed = true };

            // first game of series
            if (Table.ActivePlayer == null) {
                Table.SetNextPlayer();
            }
            else {
                if (IsEliminated(Table.ActivePlayer)) {
                    Table.SetNextPlayer();
                }
            }
        }

        public void SetPlayerDicesQty(Player player, int delta) {
            PlayerCups.First(pc => pc.Player == player).DicesQuantity += delta;
            if (delta < 0) {
                DiceLoser = player;
            }
            else {
                DiceWinner = player;
            }
            Table.SetNextPlayer(player);
        }

        public override bool IsEliminated(Player player) {
            return PlayerCups.First(pc => pc.Player == player).DicesQuantity <= 0;
        }

        public GameChangeResult End(GameAction endAction) {
            IsEnded = true;
            EndAction = endAction;

            // transition lock status
            if (HasLock) {
                PlayerCups.First(pc => pc.LockStatus == LockStatus.Locking).LockStatus = LockStatus.Unavailable;
            }

            // highlight matching dices
            foreach (var matchingDice in PlayerCups.SelectMany(pc => pc.Dices).Where(d => d.Value == Dice.Value || d.Value == 1)) {
                matchingDice.IsHighlighted = true;
            }

            // check if table ends
            var playersWithDices = PlayerCups.Where(pc => pc.DicesQuantity > 0).Select(pc => pc.Player);
            if (playersWithDices.Count() == 1) {
                Table.End(playersWithDices);
            }

            var gameEndResult = new GameChangeResult(new {
                actualQuantity = ActualQuantity,
                playerCups = PlayerCups.Select(pc => pc.ToClient()),
                table = new {
                    status = Table.Status.ToString(),
                    activePlayerName = Table.ActivePlayer?.Name,
                    stats = Table.GetStats(),
                    winnerNames = Table.Winners.Select(p => p.Name)
                },
                isEnded = IsEnded,
                winnerNames = Winners.Select(p => p.Name),
                endActionName = EndAction?.Name,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            });

            return gameEndResult;
        }

        public override object ToClient() {
            var client = new {
                playerCups = PlayerCups.Select(pc => pc.ToClient()),
                quantity = Quantity,
                dice = Dice.ToClient(),
                hasLock = HasLock,
                actualQuantity = ActualQuantity,
                endActionName = EndAction?.Name,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            };
            return client.Merge(base.ToClient());
        }

        public override Dictionary<Player, object> GetPlayerGameStates() {
            return PlayerCups.ToDictionary(
                pc => pc.Player,
                pc => (object)new { dices = pc.Dices.Select(d => d.ToClient(true)) }
            );
        }

        public override object ToStats() {
            var stats = new {
                endActionName = EndAction?.Name,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            };
            return stats.Merge(base.ToStats());
        }
    }

    public class BetAction : GameAction
    {
        public override string Name => "bet";

        private Doubt _doubt;

        public BetAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute(int quantity, int diceValue, bool rollOthers) {
            if (_doubt.HasLock && _doubt.HasBet) {
                if (diceValue != _doubt.Dice.Value) {
                    throw new TableGamesException("Dice value can't be changed when lock is in place.");
                }
            }

            if (!isValid(_doubt.Quantity, _doubt.Dice.Value, quantity, diceValue)) {
                throw new TableGamesException("Invalid action. See possible bets.");
            };

            _doubt.Quantity = quantity;
            _doubt.Dice.Value = diceValue;

            // objects to return
            object gameState = null;
            IEnumerable<object> playerCups = new List<object>();
            Dictionary<Player, object> playerGameStates = new Dictionary<Player, object>();

            if (rollOthers) {
                foreach (var dice in _doubt.PlayerCups.First(pc => pc.Player == _doubt.Table.ActivePlayer).Dices.Where(d => !d.IsExposed)) {
                    if (dice.Value == diceValue || dice.Value == 1) {
                        dice.IsExposed = true;
                    }
                    else {
                        dice.Roll();
                    }
                }
                playerCups = _doubt.PlayerCups.Select(pc => pc.ToClient());

                playerGameStates = _doubt.GetPlayerGameStates();
            }

            _doubt.Table.SetNextPlayer();

            gameState = new {
                playerCups = playerCups,
                quantity = _doubt.Quantity,
                dice = _doubt.Dice.ToClient(),
                table = new {
                    activePlayerName = _doubt.Table.ActivePlayer?.Name
                }
            };

            return new GameChangeResult(gameState, playerGameStates);
        }

        private bool isValid(int fromQuantity, int fromDiceValue, int toQuantity, int toDiceValue) {
            var valid = false;

            if (toDiceValue < fromDiceValue) {
                if (toDiceValue == 1) {
                    if (toQuantity >= (fromQuantity / 2 + 1)) {
                        valid = true;
                    }
                }
                else {
                    if (toQuantity > fromQuantity) {
                        valid = true;
                    }
                }
            }
            else if (fromDiceValue == toDiceValue) {
                if (toQuantity > fromQuantity) {
                    valid = true;
                }
            }
            else if (toDiceValue > fromDiceValue) {
                if (fromDiceValue == 1) {
                    if (toQuantity >= (fromQuantity * 2 + 1)) {
                        valid = true;
                    }
                }
                else {
                    if (toQuantity >= fromQuantity) {
                        valid = true;
                    }
                }
            }
            return valid;
        }
    }

    public class DoubtAction : GameAction
    {
        public override string Name => "doubt";

        private Doubt _doubt;

        public DoubtAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute() {
            if (!_doubt.HasBet) {
                throw new TableGamesException("Invalid action. There is no bet.");
            };

            if (_doubt.Quantity > _doubt.ActualQuantity) {
                _doubt.Winners.Add(_doubt.Table.ActivePlayer);
                _doubt.SetPlayerDicesQty(_doubt.Table.GetPreviousPlayer(_doubt.Table.ActivePlayer), -1);
            }
            else {
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, -1);
            }

            _doubt.PlayerCups.ForEach(pc => pc.ExposeDices());

            var gameEndResult = _doubt.End(this);

            return gameEndResult;
        }
    }

    public class MatchAction : GameAction
    {
        public override string Name => "match";
        public bool IsUserAllowed {
            get {
                return (_doubt.PlayerCups.FirstOrDefault(pc => pc.Player == _doubt.Table.ActivePlayer)?.Dices.Count ?? 5) < 5;
            }
        }

        private Doubt _doubt;

        public MatchAction(Doubt doubt) {
            _doubt = doubt;
        }

        public GameChangeResult Execute() {
            if (!_doubt.HasBet || !IsUserAllowed) {
                throw new TableGamesException("Invalid action. Match is only available when less than five dices.");
            };

            if (_doubt.Quantity == _doubt.ActualQuantity) {
                _doubt.Winners.Add(_doubt.Table.ActivePlayer);
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, 1);
            }
            else {
                _doubt.SetPlayerDicesQty(_doubt.Table.ActivePlayer, -1);
            }

            _doubt.PlayerCups.ForEach(pc => pc.ExposeDices());

            var gameEndResult = _doubt.End(this);

            return gameEndResult;
        }
    }
}