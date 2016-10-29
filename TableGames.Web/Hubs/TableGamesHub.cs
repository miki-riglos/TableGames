using Microsoft.AspNet.SignalR;

namespace TableGames.Web.Hubs
{
    public class TableGamesHub : Hub
    {
        public void SendMessage(string userName, string message) {
            Clients.All.addMessage(userName, message);
        }
    }
}