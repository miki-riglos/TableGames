using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace TableGames.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index() {
            return View();
        }

        public IActionResult About() {
            ViewData["Message"] = "Table Games web application.";

            return View();
        }

        public IActionResult Error() {
            return View();
        }
    }
}
