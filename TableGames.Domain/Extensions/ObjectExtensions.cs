using System.Linq;
using System.Reflection;

namespace TableGames.Domain.Extensions
{
    public static class ObjectExtensions
    {
        public static TTo SetPropertiesFrom<TTo, TFrom>(this TTo toObject, TFrom fromObject) where TTo : class where TFrom : class {
            PropertyInfo[] fromPropertyInfos = fromObject.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.GetProperty);
            PropertyInfo[] toPropertyInfos = toObject.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.SetProperty);

            foreach (var fromPropertyInfo in fromPropertyInfos) {
                var toPropertyInfo = toPropertyInfos.FirstOrDefault(x => x.Name == fromPropertyInfo.Name);
                if (toPropertyInfo != null && toPropertyInfo.CanWrite)
                    toPropertyInfo.SetValue(toObject, fromPropertyInfo.GetValue(fromObject));
            }

            return toObject;
        }
    }
}
