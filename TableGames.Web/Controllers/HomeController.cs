using System.Collections.Generic;
using System.Web.Mvc;
using TableGames.Domain;

namespace TableGames.Web.Controllers
{
    public class HomeController : Controller
    {
        private static Dictionary<string, string> _contentTypes = new Dictionary<string, string>() {
            { "js", "application/x-javascript" },
            { "html", "text/html; charset=utf-8" },
            { "svg", "image/svg+xml; charset=utf-8" },
            { "png", "image/png" }
        };

        public ActionResult Index() {
            return View();
        }

        // Using QS parameters to avoid issues with file extensions (MVC and requirejs)
        [Route("GameResource")]
        public ActionResult GameResource(string gameName, string fileName, string extension) {
            string contentType;
            if (_contentTypes.TryGetValue(extension, out contentType)) {
                return File(GameInfo.GetGameResource(gameName, fileName, extension), contentType);
            }
            return HttpNotFound();
        }
    }
}