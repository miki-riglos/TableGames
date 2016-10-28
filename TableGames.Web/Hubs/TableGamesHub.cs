using Microsoft.AspNet.SignalR;
using System;

namespace TableGames.Web.Hubs
{
    public class TableGamesHub : Hub
    {
        public void Hello() {
            Clients.All.hello(DateTime.Now.ToString("T"));
        }
    }
}