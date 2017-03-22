using Microsoft.VisualStudio.TestTools.UnitTesting;
using TableGames.Domain;
using TableGames.Games;
using TableGames.Games.Doubt;

namespace TableGames.Tests
{
    [TestClass]
    public class DoubtTest
    {
        [ClassInitialize]
        public static void LoadDependantAssemblies(TestContext testContext) {
            var doubtType = typeof(Doubt);
            var higherDiceType = typeof(HigherDice);
        }

        [TestMethod]
        public void DoubtTableTest() {
            var hostPlayer = new Player("hostPlayer");
            var otherPlayer = new Player("otherPlayer");

            var room = hostPlayer.AddRoom("main");
            room.CreateTable("Doubt");
                
            room.Table.AddPlayer(hostPlayer);
            room.Table.AddPlayer(otherPlayer);

            if (!room.Table.Start()) {   // higher dice
                Assert.Fail("Higher Dice game did not start.");
            }
            if (!room.Table.Start()) {   // doubt
                Assert.Fail("Doubt game did not start.");
            }

            var doubt = (Doubt)room.Table.Game;
            Assert.IsNotNull(doubt);
        }
    }
}
