using System.Collections.Generic;
using System.Linq;
using TableGames.Domain;
using TableGames.Domain.Extensions;

namespace TableGames.Games.InBetween
{
    [GameDescriptor("In Between", InitialGameType = typeof(HigherCard))]
    public class InBetween : Game
    {
        private readonly TablePot _tablePot;    // pot wrapper to store in table bag by reference
        private readonly List<Deck> _decks;

        public List<InBetweenPlayerHand> PlayerHands { get; set; }
        public int Bet { get; set; }
        public InBetweenPlayerHand ActiveHand { get; private set; }
        public int Payment { get; set; }
        public Deck Deck {
            get { return _decks.Last(); }
        }
        public int Pot {
            get { return _tablePot.Amount; }
            set { _tablePot.Amount = value; }
        }

        public InBetween(Table table) : base(table) {
            _tablePot = Table.GetBagItem("TablePot", () => new TablePot(500));
            _decks = Table.GetBagItem("TableDecks", () => new List<Deck>() { new Deck() });

            var playerBags = Table.GetBagItem("PlayerBags", () => Table.Players.ToDictionary(
                p => p,
                p => new InBetweenPlayerBag() { Chips = 500 }
            ));
            PlayerHands = new List<InBetweenPlayerHand>(playerBags.Select(kvp => new InBetweenPlayerHand(kvp.Key, kvp.Value)));

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
            return PlayerHands.First(ph => ph.Player == player).Chips <= 0;
        }

        public override object ToClient() {
            var client = new {
                pot = Pot,
                playerHands = PlayerHands.Select(pc => pc.ToClient()),
                bet = Bet,
                payment = Payment
            };
            return client.Merge(base.ToClient());
        }

        public override object ToStats() {
            var stats = new {
                playerName = ActiveHand.Player.Name,
                bet = Bet,
                payment = Payment
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
            //if (_inBetween.HasLock && _inBetween.HasBet) {
            //    if (diceValue != _inBetween.Dice.Value) {
            //        throw new TableGamesException("Dice value can't be changed when lock is in place.");
            //    }
            //}

            _inBetween.ActiveHand.Cards.Add(_inBetween.Deck.DealExposed());

            var leftValue = _inBetween.ActiveHand.Cards[0].ValueA1;
            var rightValue = _inBetween.ActiveHand.Cards[1].ValueA1;
            var middleValue = _inBetween.ActiveHand.Cards[2].ValueA1;

            if ((leftValue < middleValue && middleValue < rightValue) || (leftValue > middleValue && middleValue > rightValue)) {
                _inBetween.Payment = amount;        // win
            }
            else if (leftValue == middleValue && middleValue == rightValue) {
                _inBetween.Payment = -2 * amount;   // post lose
            }
            else {
                _inBetween.Payment = -amount;       // simple lose
            }
            _inBetween.ActiveHand.Chips += _inBetween.Payment;
            _inBetween.Pot -= _inBetween.Payment;

            _inBetween.IsEnded = true;

            _inBetween.Table.SetNextPlayer();

            var gameState = new {
                bet = _inBetween.Bet,
                playerHands = _inBetween.PlayerHands.Select(pc => pc.ToClient()),
                payment = _inBetween.Payment,
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
}