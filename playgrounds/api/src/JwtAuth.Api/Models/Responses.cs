namespace JwtAuth.Api.Models;

public record AuthResponse(string Access_token, string Refresh_token, UserDto User, int Expires_in, string Token_type = "Bearer");

public record UserDto(string Id, string Email, string[] Roles);

public record TokenValidationResponse(
    bool IsValid,
    string Message,
    string? ExpirationUtc = null,
    string? ExpirationLocal = null,
    int? ExpiresInSeconds = null,
    bool Expired = true,
    TokenInfo? TokenInfo = null,
    string? Error = null
);

public record TokenInfo(
    string Issuer,
    string Audience,
    string IssuedAtUtc,
    string IssuedAtLocal,
    string ValidFromUtc,
    string ValidFromLocal,
    string ValidToUtc,
    string ValidToLocal,
    string UserId,
    string Email,
    string Role,
    string CurrentTimeUtc,
    string CurrentTimeLocal
);
