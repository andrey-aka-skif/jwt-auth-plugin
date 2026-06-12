using JwtAuth.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace JwtAuth.Api.Endpoints;

public static class ApiEndpoints
{
    public static void MapApiEndpoints(this WebApplication app)
    {
        app.MapGet("/api/protected", (
            HttpContext ctx,
            [FromServices] TokenService tokenService) =>
        {
            var authHeader = ctx.Request.Headers.Authorization.ToString();
            var token = authHeader.StartsWith("Bearer ") ? authHeader["Bearer ".Length..] : null;

            var response = tokenService.ValidateTokenWithDetails(token);
            return Results.Ok(response);
        }).RequireAuthorization();

        app.MapGet("/api/content", () =>
        {
            return Results.Ok("Контент");
        }).AllowAnonymous();
    }
}
