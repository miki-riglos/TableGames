using System.Web.Mvc;
using TableGames.Domain;

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
            return JavaScript(GameInfo.GetGameScript(gameName, fileName));
        }

        [Route("GameTemplate")]
        public ActionResult Template(string gameName, string fileName) {
            return Content(GameInfo.GetGameTemplate(gameName, fileName));
        }
    }
}