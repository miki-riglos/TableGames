using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Owin;
using System;
using TableGames.Domain;

namespace TableGames.Web
{
    public class Startup
    {
        public void Configuration(IAppBuilder app) {
            GlobalHost.HubPipeline.AddModule(new LoggingPipelineModule());
            app.MapSignalR();
        }
    }

    public class LoggingPipelineModule : HubPipelineModule
    {
        protected override void OnIncomingError(ExceptionContext exceptionContext, IHubIncomingInvokerContext invokerContext) {
            // if TableGamesException, convert to HubException to be exposed in clients
            var tableGamesException = getTableGamesException(exceptionContext.Error);
            if (tableGamesException != null) {
                exceptionContext.Error = new HubException(tableGamesException.Message);
            }
            base.OnIncomingError(exceptionContext, invokerContext);
        }

        private TableGamesException getTableGamesException(Exception exception) {
            TableGamesException tableGamesException = null;

            if (exception.GetType() == typeof(TableGamesException)) {
                tableGamesException = (TableGamesException)exception;
            }
            else if (exception.InnerException != null) {
                tableGamesException = getTableGamesException(exception.InnerException);
            }

            return tableGamesException;
        }
    }
}