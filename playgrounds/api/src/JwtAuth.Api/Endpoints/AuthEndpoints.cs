using JwtAuth.Api.Configuration;
using JwtAuth.Api.Helpers;
using JwtAuth.Api.Models;
using JwtAuth.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace JwtAuth.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        const string USER_EMAIL = "admin@test.com";
        const string USER_PASSWORD = "password123";
        const string USER_ROLE = "User";

        app.MapPost("/api/auth/login", (
            [FromBody] LoginRequest request,
            [FromServices] TokenService tokenService,
            [FromServices] ConcurrentDictionary<string, RefreshTokenRecord> refreshTokens,
            [FromServices] JwtSettings jwtSettings) =>
        {
            // TODO: заменить на реальную проверку хеша пароля из БД
            if (request.Email != USER_EMAIL || request.Password != USER_PASSWORD)
                return Results.Unauthorized();

            var userId = Guid.NewGuid().ToString();
            var role = USER_ROLE;

            var (accessToken, refreshToken) = tokenService.GenerateTokenPair(userId, request.Email, role);

            refreshTokens[refreshToken] = new RefreshTokenRecord(
                userId,
                DateTime.UtcNow.AddMinutes(jwtSettings.RefreshTokenLifetimeMinutes),
                false);

            ConsoleLogger.LogInfo("", "---------------------------------");
            ConsoleLogger.LogLogin(request.Email, request.Password, refreshToken);

            return Results.Ok(
                new AuthResponse(
                    accessToken,
                    refreshToken,
                    new UserDto(userId, request.Email, [role]),
                    jwtSettings.AccessTokenLifetimeSeconds));
        }).AllowAnonymous();


        app.MapPost("/api/auth/refresh", (
            [FromBody] RefreshRequest request,
            [FromServices] TokenService tokenService,
            [FromServices] ConcurrentDictionary<string, RefreshTokenRecord> refreshTokens,
            [FromServices] JwtSettings jwtSettings) =>
        {
            if (string.IsNullOrWhiteSpace(request.Refresh_token))
            {
                ConsoleLogger.LogRefreshFailure(request.Refresh_token ?? "null", "Refresh token отсутствует");
                return Results.Unauthorized();
            }

            if (!refreshTokens.TryGetValue(request.Refresh_token, out var stored))
            {
                ConsoleLogger.LogRefreshFailure(request.Refresh_token, "Токен не найден в хранилище");
                return Results.Unauthorized();
            }

            if (stored.IsRevoked)
            {
                ConsoleLogger.LogRefreshFailure(request.Refresh_token, "Токен отозван (revoked)");
                refreshTokens.TryRemove(request.Refresh_token, out _);
                return Results.Unauthorized();
            }

            if (stored.ExpiresAt < DateTime.UtcNow)
            {
                ConsoleLogger.LogRefreshFailure(request.Refresh_token, $"Токен истёк (ExpiresAt: {stored.ExpiresAt:yyyy-MM-dd HH:mm:ss} UTC)");
                refreshTokens.TryRemove(request.Refresh_token, out _);
                return Results.Unauthorized();
            }

            // Ротация: старый удаляем, новый выдаём
            refreshTokens.TryRemove(request.Refresh_token, out _);

            var (newAccessToken, newRefreshToken) = tokenService.GenerateTokenPair(
                stored.UserId, USER_EMAIL, USER_ROLE);

            refreshTokens[newRefreshToken] = new RefreshTokenRecord(
                stored.UserId,
                DateTime.UtcNow.AddMinutes(jwtSettings.RefreshTokenLifetimeMinutes),
                false);

            ConsoleLogger.LogRefresh(request.Refresh_token, newRefreshToken);

            return Results.Ok(
                new AuthResponse(
                    newAccessToken,
                    newRefreshToken,
                    new UserDto(stored.UserId, USER_EMAIL, [USER_ROLE]),
                    jwtSettings.AccessTokenLifetimeSeconds));
        }).AllowAnonymous();


        app.MapPost("/api/auth/logout", (
            [FromBody] LogoutRequest req,
            [FromServices] ConcurrentDictionary<string, RefreshTokenRecord> refreshTokens
            ) =>
        {
            if (!string.IsNullOrWhiteSpace(req.Refresh_token))
                refreshTokens.TryRemove(req.Refresh_token, out _);

            ConsoleLogger.LogLogout(req.Refresh_token ?? "null");

            return Results.Ok();
        }).AllowAnonymous();


        app.MapGet("/api/auth/me", (
            HttpContext httpContext,
            [FromServices] TokenService tokenService) =>
        {
            // Получить токен из заголовка
            var token = httpContext.Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();

            if (string.IsNullOrEmpty(token))
                return Results.Unauthorized();

            // Используем сервис для валидации и извлечения данных
            var userData = tokenService.ExtractUserFromToken(token);

            if (userData == null)
                return Results.Unauthorized();

            var (userId, email, role) = userData.Value;

            return Results.Ok(new
            {
                id = userId,
                email,
                role,
                roles = new[] { role }
            });
        }).RequireAuthorization();
    }
}
