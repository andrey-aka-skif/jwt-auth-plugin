namespace JwtAuth.Api.Models;

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string Refresh_token);

public record LogoutRequest(string Refresh_token);
