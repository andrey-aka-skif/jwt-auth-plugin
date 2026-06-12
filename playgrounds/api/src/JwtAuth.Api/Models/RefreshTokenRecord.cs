namespace JwtAuth.Api.Models;

public record RefreshTokenRecord(string UserId, DateTime ExpiresAt, bool IsRevoked);
