using System;
using System.Collections.Generic;
using System.Linq;

namespace TableGames.Games
{
    public class Deck
    {
        private Stack<Card> _cards;

        public int Count { get { return _cards.Count; } }

        public Deck() {
            var cards = new List<Card>();
            foreach (CardSuit suit in Enum.GetValues(typeof(CardSuit)).Cast<CardSuit>().Where(s => s != CardSuit.Unknown)) {
                foreach (CardRank rank in Enum.GetValues(typeof(CardRank)).Cast<CardRank>().Where(r => r != CardRank.Unknown)) {
                    cards.Add(new Card(suit, rank));
                }
            }
            shuffle(cards);

            _cards = new Stack<Card>(cards);
        }

        public Card Deal() {
            return _cards.Pop();
        }

        public Card DealExposed() {
            var card = _cards.Pop();
            card.IsExposed = true;
            return card;
        }

        private void shuffle(List<Card> cards) {
            Random random = new Random(Guid.NewGuid().GetHashCode());
            int count = cards.Count;
            while (count > 1) {
                count--;
                int index = random.Next(count + 1);
                var value = cards[index];
                cards[index] = cards[count];
                cards[count] = value;
            }
        }

        public object ToClient() {
            return _cards.Select(c => c.ToClient());
        }
    }
}