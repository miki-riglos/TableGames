namespace TableGames.Domain
{
    public class UserSettings
    {
        public bool JoinTableAfterRoomEntered { get; set; }
        public bool JoinTableAfterTableCreated { get; set; }

        public UserSettings() {
            JoinTableAfterRoomEntered = true;
            JoinTableAfterTableCreated = true;
        }

        public object ToClient() {
            return new {
                joinTableAfterRoomEntered = JoinTableAfterRoomEntered,
                joinTableAfterTableCreated = JoinTableAfterTableCreated
            };
        }
    }
}