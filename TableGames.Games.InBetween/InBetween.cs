using System;
using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;
using TableGames.Domain.Extensions;

namespace TableGames.Games.InBetween
{
    [GameDescriptor("In Between", InitialGameType = typeof(HigherCard))]
    public class InBetween : Game
    {
        public const int LOT_AMOUNT = 500;
        public const int MIN_BET_AMOUNT = 10;

        private readonly Chips _chips;
        private readonly List<Deck> _decks;

        public List<InBetweenPlayerHand> PlayerHands { get; set; }
        public InBetweenPlayerHand ActiveHand { get; private set; }
        public Deck Deck {
            get { return _decks.Last(); }
        }
        public int Bank {
            get { return _chips.Amount; }
            set { _chips.Amount = value; }
        }
        public int Pot {
            get { return _chips.Balance; }
            set { _chips.Balance = value; }
        }

        public InBetween(Table table) : base(table) {
            _chips = Table.GetBagItem("TablePot", () => new Chips());
            _decks = Table.GetBagItem("TableDecks", () => new List<Deck>() { new Deck() });

            if (Deck.Count < 3) {
                _decks.Add(new Deck());
            }

            var playerBags = Table.GetBagItem("PlayerBags", () => Table.Players.ToDictionary(
                p => p,
                p => new InBetweenPlayerBag()
            ));
            PlayerHands = new List<InBetweenPlayerHand>(playerBags.Select(kvp => new InBetweenPlayerHand(kvp.Key, kvp.Value)));

            // initial pot
            if (Pot == 0) {
                foreach (var playerHand in PlayerHands) {
                    if (playerHand.ChipsBalance <= 3 * MIN_BET_AMOUNT) {
                        playerHand.ChipsPurchased += LOT_AMOUNT;
                        playerHand.ChipsBalance += LOT_AMOUNT;
                        Bank += LOT_AMOUNT;
                    }

                    playerHand.ChipsBalance -= MIN_BET_AMOUNT;
                    Pot += MIN_BET_AMOUNT;
                }
            }

            // first game of series
            if (Table.ActivePlayer == null) {
                Table.SetNextPlayer();
            }
            else {
                if (IsEliminated(Table.ActivePlayer)) {
                    Table.SetNextPlayer();
                }
            }

            // deal active hand
            ActiveHand = PlayerHands.First(ph => ph.Player == Table.ActivePlayer);
            ActiveHand.Cards.Add(Deck.DealExposed());
            ActiveHand.Cards.Add(Deck.DealExposed());
        }

        public override bool IsEliminated(Player player) {
            return PlayerHands.First(ph => ph.Player == player).ChipsBalance <= 0;
        }

        public override object ToClient() {
            var client = new {
                bank = Bank,
                pot = Pot,
                playerHands = PlayerHands.Select(pc => pc.ToClient()),
            };
            return client.Merge(base.ToClient());
        }

        public override object ToStats() {
            var stats = new {
                playerName = ActiveHand.Player.Name,
                bet = ActiveHand.Bet,
                payment = ActiveHand.Payment
            };
            return stats.Merge(base.ToStats());
        }
    }

    public class BetAction : GameAction
    {
        public override string Name => "bet";

        private InBetween _inBetween;

        public BetAction(InBetween inBetween) {
            _inBetween = inBetween;
        }

        public GameChangeResult Execute(int amount) {
            var maxBetAmount = Math.Max(_inBetween.ActiveHand.ChipsBalance / 2, _inBetween.Pot);
            if (amount > maxBetAmount) {
                throw new TableGamesException("Invalid Bet amount.");
            }

            _inBetween.ActiveHand.Bet = amount;
            _inBetween.ActiveHand.Cards.Add(_inBetween.Deck.DealExposed());

            var leftValue = _inBetween.ActiveHand.Cards[0].ValueA1;
            var rightValue = _inBetween.ActiveHand.Cards[1].ValueA1;
            var middleValue = _inBetween.ActiveHand.Cards[2].ValueA1;

            if ((leftValue < middleValue && middleValue < rightValue) || (leftValue > middleValue && middleValue > rightValue)) {
                _inBetween.ActiveHand.Payment = amount;        // win
                _inBetween.ActiveHand.Cards[2].IsHighlighted = true;
            }
            else if (leftValue == middleValue || middleValue == rightValue) {
                _inBetween.ActiveHand.Payment = -2 * amount;   // post lose
            }
            else {
                _inBetween.ActiveHand.Payment = -amount;       // simple lose
            }
            _inBetween.ActiveHand.ChipsBalance += _inBetween.ActiveHand.Payment;
            _inBetween.Pot -= _inBetween.ActiveHand.Payment;

            _inBetween.IsEnded = true;

            _inBetween.Table.SetNextPlayer();

            var gameState = new {
                playerHands = _inBetween.PlayerHands.Select(pc => pc.ToClient()),
                pot = _inBetween.Pot,
                isEnded = _inBetween.IsEnded,
                table = new {
                    status = _inBetween.Table.Status.ToString(),
                    activePlayerName = _inBetween.Table.ActivePlayer?.Name,
                    stats = _inBetween.Table.GetStats(),
                }
            };

            return new GameChangeResult(gameState);
        }
    }

    public class BuyAction : GameAction
    {
        public override string Name => "buy";

        private InBetween _inBetween;

        public BuyAction(InBetween inBetween) {
            _inBetween = inBetween;
        }

        public GameChangeResult Execute(bool returnChips) {
            if (returnChips) {
                if (_inBetween.ActiveHand.ChipsBalance < InBetween.LOT_AMOUNT) {
                    throw new TableGamesException($"Chips Balance is less than {InBetween.LOT_AMOUNT}");
                }
            }

            var factor = returnChips ? -1 : 1;

            _inBetween.ActiveHand.ChipsBalance += factor * InBetween.LOT_AMOUNT;
            _inBetween.ActiveHand.ChipsPurchased += factor * InBetween.LOT_AMOUNT;
            _inBetween.Bank += factor * InBetween.LOT_AMOUNT;

            var gameState = new {
                playerHands = _inBetween.PlayerHands.Select(pc => pc.ToClient()),
                bank = _inBetween.Bank,
                table = new {
                    stats = _inBetween.Table.GetStats(),
                }
            };

            return new GameChangeResult(gameState);
        }
    }

}