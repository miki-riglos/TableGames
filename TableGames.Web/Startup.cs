using Owin;

namespace TableGames.Web
{
    public class Startup
    {
        public void Configuration(IAppBuilder app) {
            app.MapSignalR();
        }
    }
}