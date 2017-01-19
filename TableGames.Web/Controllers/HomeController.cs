using System.IO;
using System.Linq;
using System.Web.Mvc;
using TableGames.Web.Entities;

namespace TableGames.Web.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index() {
            return View();
        }

        // Using QS parameters to avoid issues with file extensions (MVC and requirejs)
        [Route("GameScript")]
        public ActionResult Script(string gameName, string fileName) {
            var gameAssembly = GameInfo.Registry.First(gi => gi.Name == gameName).Type.Assembly;
            var resourceName =  gameAssembly.GetManifestResourceNames().First(name => name.EndsWith($"{fileName}.js"));

            using (Stream stream = gameAssembly.GetManifestResourceStream(resourceName)) {
                using (var reader = new StreamReader(stream)) {
                    return JavaScript(reader.ReadToEnd());
                }
            }
        }

        [Route("GameTemplate")]
        public ActionResult Template(string gameName, string fileName) {
            var gameAssembly = GameInfo.Registry.First(gi => gi.Name == gameName).Type.Assembly;
            var resourceName = gameAssembly.GetManifestResourceNames().First(name => name.EndsWith($"{fileName}.html"));

            using (Stream stream = gameAssembly.GetManifestResourceStream(resourceName)) {
                using (var reader = new StreamReader(stream)) {
                    return Content(reader.ReadToEnd());
                }
            }
        }
    }
}