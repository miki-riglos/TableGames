using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;

namespace TableGames.Games.Doubt
{
    [GameDescriptor("Doubt", "doubt")]
    public class Doubt : Game
    {
        public List<PlayerCup> PlayerCups { get; set; }
        public int Quantity { get; set; }
        public Dice Dice { get; set; }
        public bool HasLock { get; set; }
        public int ActualQuantity { get; set; }
        public GameAction EndAction { get; private set; }
        public Player DiceLoser { get; private set; }
        public Player DiceWinner { get; private set; }
        public bool HasBet { get { return Dice.Value > 0; } }

        public Doubt(Table table) : base(table) {
            HasLock = false;

            // transition lock status
            foreach (var kvp in getPlayerBags()) {
                if (kvp.Value.DicesQuantity == 1 && kvp.Value.LockStatus == LockStatus.Available) {
                    kvp.Value.LockStatus = LockStatus.Locking;
                    HasLock = true;
                }
            }

            PlayerCups = new List<PlayerCup>(getPlayerBags().Select(kvp => new PlayerCup(kvp.Key, kvp.Value)));
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

        public int GetActualQuantity() {
            var actualQuantiy = PlayerCups.SelectMany(pc => pc.Dices).Count(d => d.Value == Dice.Value);
            // add wildcards
            if (Dice.Value > 1) {
                actualQuantiy += PlayerCups.SelectMany(pc => pc.Dices).Count(d => d.Value == 1);
            }
            return actualQuantiy;
        }

        public void SetPlayerDicesQty(Player player, int delta) {
            getPlayerBags()[player].DicesQuantity += delta;
            if (delta < 0) {
                DiceLoser = player;
            }
            else {
                DiceWinner = player;
            }
            Table.SetNextPlayer(player);
        }

        public override bool IsEliminated(Player player) {
            return getPlayerBags()[player].DicesQuantity <= 0;
        }

        public GameChangeResult End(GameAction endAction) {
            IsEnded = true;
            EndAction = endAction;

            // transition lock status
            if (HasLock) {
                var playerLocking = PlayerCups.First(pc => pc.LockStatus == LockStatus.Locking).Player;
                getPlayerBags()[playerLocking].LockStatus = LockStatus.Unavailable;
            }

            // check if table ends
            var playersWithDices = getPlayerBags().Where(kvp => kvp.Value.DicesQuantity > 0).Select(kvp => kvp.Key);
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
            return new {
                playerCups = PlayerCups.Select(pc => pc.ToClient()),
                quantity = Quantity,
                dice = Dice.ToClient(),
                hasLock = HasLock,
                actualQuantity = ActualQuantity,
                table = new {
                    activePlayerName = Table.ActivePlayer?.Name,
                },
                isEnded = IsEnded,
                winnerNames = Winners.Select(p => p.Name),
                endActionName = EndAction?.Name,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            };
        }

        public override Dictionary<Player, object> GetPlayerGameStates() {
            return PlayerCups.ToDictionary(
                pc => pc.Player,
                pc => (object)new { dices = pc.Dices.Select(d => d.ToClient(true)) }
            );
        }

        public override object ToStats() {
            return new {
                isEnded = IsEnded,
                winnerNames = Winners.Select(p => p.Name),
                endActionName = EndAction?.Name,
                diceLoserName = DiceLoser?.Name,
                diceWinnerName = DiceWinner?.Name
            };
        }

        private Dictionary<Player, PlayerBag> getPlayerBags() {
            Dictionary<Player, PlayerBag> playerBags;
            var bagKey = "PlayerBag";
            if (!Table.Bag.ContainsKey(bagKey)) {
                playerBags = Table.Players.ToDictionary(
                    p => p, 
                    p => new PlayerBag() {
                        DicesQuantity = 5,
                        LockStatus = LockStatus.Available
                    }
                );
                Table.Bag.Add(bagKey, playerBags);
            }
            else {
                playerBags = (Dictionary<Player, PlayerBag>)Table.Bag[bagKey];
            }

            return playerBags;
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
                throw new TableGamesException("Invalid bet.");
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
                throw new TableGamesException("Invalid action.");
            };

            _doubt.ActualQuantity = _doubt.GetActualQuantity();
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
                throw new TableGamesException("Invalid action.");
            };

            _doubt.ActualQuantity = _doubt.GetActualQuantity();
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