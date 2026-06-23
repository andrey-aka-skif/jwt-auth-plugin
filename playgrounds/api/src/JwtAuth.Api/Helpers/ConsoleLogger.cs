namespace JwtAuth.Api.Helpers;

public static class ConsoleLogger
{
    public static void LogInfo(string category, string message)
    {
        var timestamp = DateTime.Now.ToString("[HH:mm:ss.fff]");
        Console.WriteLine($"{timestamp} [{category}] {message}");
    }

    public static void LogRefresh(string oldRefreshToken, string newRefreshToken)
    {
        // Показываем только первые 8 символов токенов для читаемости
        var oldShort = oldRefreshToken.Length > 8 ? oldRefreshToken[..8] : oldRefreshToken;
        var newShort = newRefreshToken.Length > 8 ? newRefreshToken[..8] : newRefreshToken;
        LogInfo("Refresh", $"{oldShort}... -> {newShort}...");
    }

    public static void LogRefreshFailure(string refreshToken, string reason)
    {
        var shortToken = refreshToken.Length > 8 ? refreshToken[..8] : refreshToken;
        LogInfo("RefreshFailure", $"{shortToken}... | Причина: {reason}");
    }

    public static void LogLogin(string username, string password, string refreshToken)
    {
        var shortToken = refreshToken.Length > 8 ? refreshToken[..8] : refreshToken;
        LogInfo("Login", $"{username}:{password}. Refresh Token: {shortToken}...");
    }

    public static void LogLogout(string refreshToken)
    {
        var shortToken = refreshToken.Length > 8 ? refreshToken[..8] : refreshToken;
        LogInfo("Logout", $"Refresh Token: {shortToken}...");
    }
}
