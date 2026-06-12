using JwtAuth.Api.Configuration;
using JwtAuth.Api.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace JwtAuth.Api.Services;

/// <summary>
/// Сервис для генерации JWT токенов
/// </summary>
/// <remarks>
/// См. <seealso href="https://datatracker.ietf.org/doc/html/rfc6750">RFC 6750</seealso>
/// </remarks>
/// <param name="settings"></param>
public class TokenService(JwtSettings settings)
{
    private readonly JwtSettings _settings = settings;

    public string GenerateJwtToken(string userId, string email, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer, audience: _settings.Audience, claims: claims,
            expires: DateTime.UtcNow.AddSeconds(_settings.AccessTokenLifetimeSeconds),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string GenerateSecureToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string GenerateRefreshToken()
        => GenerateSecureToken();

    public (string accessToken, string refreshToken) GenerateTokenPair(string userId, string email, string role)
    {
        var accessToken = GenerateJwtToken(userId, email, role);
        var refreshToken = GenerateRefreshToken();
        return (accessToken, refreshToken);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _settings.Issuer,
                ValidAudience = _settings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret))
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public (string userId, string email, string role)? ExtractUserFromToken(string token)
    {
        var principal = ValidateAccessToken(token);
        if (principal == null)
            return null;

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        var role = principal.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(role))
            return null;

        return (userId, email, role);
    }

    public TokenValidationResponse ValidateTokenWithDetails(string? token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return new TokenValidationResponse(
                IsValid: false,
                Message: "Токен отсутствует в заголовке Authorization"
            );
        }

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var jwtToken = tokenHandler.ReadJwtToken(token);
            var expiresAtUtc = jwtToken.ValidTo;
            var nowUtc = DateTime.UtcNow;
            var isValid = expiresAtUtc > nowUtc;
            var expiresInSeconds = (int)(expiresAtUtc - nowUtc).TotalSeconds;

            var expiresAtLocal = expiresAtUtc.ToLocalTime();
            var nowLocal = nowUtc.ToLocalTime();

            var tokenInfo = ExtractTokenInfo(jwtToken, nowUtc, nowLocal);

            // Также валидируем подпись токена
            var isValidSignature = ValidateAccessToken(token) != null;

            return new TokenValidationResponse(
                IsValid: isValid && isValidSignature,
                Message: GetValidationMessage(isValid, isValidSignature),
                ExpirationUtc: expiresAtUtc.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                ExpirationLocal: expiresAtLocal.ToString("yyyy-MM-dd HH:mm:ss"),
                ExpiresInSeconds: expiresInSeconds,
                Expired: !isValid,
                TokenInfo: tokenInfo,
                Error: null
            );
        }
        catch (Exception ex)
        {
            return new TokenValidationResponse(
                IsValid: false,
                Message: $"Ошибка при чтении токена: {ex.Message}",
                ExpirationUtc: null,
                ExpirationLocal: null,
                ExpiresInSeconds: null,
                Expired: true,
                TokenInfo: null,
                Error: ex.GetType().Name
            );
        }
    }

    private static string GetValidationMessage(bool isValidLifetime, bool isValidSignature)
    {
        if (!isValidLifetime)
            return "Токен истёк";
        if (!isValidSignature)
            return "Недействительная подпись токена";
        return "Доступ разрешён. JWT валиден.";
    }

    private static TokenInfo? ExtractTokenInfo(JwtSecurityToken jwtToken, DateTime nowUtc, DateTime nowLocal)
    {
        var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var email = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var role = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
        var issuedAt = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Iat)?.Value;

        var issuedAtUtc = issuedAt != null
            ? DateTimeOffset.FromUnixTimeSeconds(long.Parse(issuedAt)).UtcDateTime
            : (DateTime?)null;
        var issuedAtLocal = issuedAtUtc?.ToLocalTime();

        return new TokenInfo(
            Issuer: jwtToken.Issuer ?? "не указан",
            Audience: jwtToken.Audiences?.FirstOrDefault() ?? "не указан",
            IssuedAtUtc: issuedAtUtc?.ToString("yyyy-MM-dd HH:mm:ss UTC") ?? "не указано",
            IssuedAtLocal: issuedAtLocal?.ToString("yyyy-MM-dd HH:mm:ss") ?? "не указано",
            ValidFromUtc: jwtToken.ValidFrom.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            ValidFromLocal: jwtToken.ValidFrom.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
            ValidToUtc: jwtToken.ValidTo.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            ValidToLocal: jwtToken.ValidTo.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
            UserId: userId ?? "не указан",
            Email: email ?? "не указан",
            Role: role ?? "не указан",
            CurrentTimeUtc: nowUtc.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            CurrentTimeLocal: nowLocal.ToString("yyyy-MM-dd HH:mm:ss")
        );
    }
}
