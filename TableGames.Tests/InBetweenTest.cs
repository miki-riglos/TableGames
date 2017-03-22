using Microsoft.VisualStudio.TestTools.UnitTesting;
using TableGames.Domain;
using TableGames.Games;
using TableGames.Games.InBetween;

namespace TableGames.Tests
{
    [TestClass]
    public class InBetweenTest
    {
        [ClassInitialize]
        public static void LoadDependantAssemblies(TestContext testContext) {
            var doubtType = typeof(InBetween);
            var higherDiceType = typeof(HigherCard);
        }

        [TestMethod]
        public void InBetweenTableTest() {
            var hostPlayer = new Player("hostPlayer");
            var otherPlayer = new Player("otherPlayer");

            var room = hostPlayer.AddRoom("main");
            room.CreateTable("In Between");

            room.Table.AddPlayer(hostPlayer);
            room.Table.AddPlayer(otherPlayer);

            if (!room.Table.Start()) {   // higher card
                Assert.Fail("Higher Card game did not start.");
            }
            if (!room.Table.Start()) {   // in between
                Assert.Fail("In Between game did not start.");
            }

            var inBetween = (InBetween)room.Table.Game;
            Assert.IsNotNull(inBetween);
        }
    }
}
