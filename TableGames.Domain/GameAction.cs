using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Reflection;

namespace TableGames.Domain
{
    public abstract class GameAction
    {
        public abstract string Name { get; }

        public virtual GameChangeResult Execute(JObject gameChangeParameters) {
            var methodInfo = this.GetType().GetMethod(nameof(this.Execute), BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
            var parameterInfos = methodInfo.GetParameters();
            var parameterValues = new List<object>();

            foreach (var parameterInfo in parameterInfos) {
                var parameterValue = gameChangeParameters.GetValue(parameterInfo.Name).ToObject(parameterInfo.ParameterType);
                parameterValues.Add(parameterValue);
            }

            var gameChangeResult = (GameChangeResult)methodInfo.Invoke(this, parameterValues.ToArray());
            return gameChangeResult;
        }
    }
}