using System;

namespace TableGames.Games
{
    public class Dice
    {
        private Random _random = new Random(Guid.NewGuid().GetHashCode());

        public bool IsExposed { get; set; }
        public int Value { get; set; }
        public int RollCount { get; private set; }

        public Dice(bool roll = false) {
            IsExposed = false;
            RollCount = 0;
            if (roll) {
                Roll();
            }
        }

        public void Roll() {
            Value = _random.Next(1, 7);
            RollCount++;
        }

        public object ToClient(bool includeValue = false) {
            return new {
                isExposed = IsExposed,
                value = IsExposed || includeValue ? Value : 0,
                rollCount = RollCount
            };
        }
    }
}