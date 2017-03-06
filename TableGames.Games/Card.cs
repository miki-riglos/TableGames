namespace TableGames.Games
{
    public enum CardSuit
    {
        Unknown,
        Clubs,
        Hearts,
        Spades,
        Diamonds
    }

    public enum CardRank
    {
        Unknown,
        Ace,
        Two,
        Three,
        Four,
        Five,
        Six,
        Seven,
        Eight,
        Nine,
        Ten,
        Jack,
        Queen,
        King
    }

    public class Card
    {
        public CardSuit Suit { get; set; }
        public CardRank Rank { get; set; }
        public bool IsExposed { get; set; }
        public bool IsHighlighted { get; set; }
        public int Value {
            get {
                if (Rank == CardRank.Ace) {
                    return 14;
                }
                return (int)Rank;
            }
        }

        public int ValueA1 {
            get {
                return (int)Rank;
            }
        }

        public Card(CardSuit suit, CardRank rank) {
            Suit = suit;
            Rank = rank;
            IsExposed = false;
        }

        public object ToClient(bool includeValue = false) {
            return new {
                isExposed = IsExposed,
                suit = IsExposed || includeValue ? Suit : CardSuit.Unknown,
                rank = IsExposed || includeValue ? Rank : CardRank.Unknown,
                isHighlighted = IsHighlighted
            };
        }
    }
}