using System.Web.Mvc;

namespace TableGames.Web.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index() {
            return View();
        }

        public ActionResult About() {
            ViewBag.Message = "Table Games web application.";

            return View();
        }
    }
}