namespace JwtAuth.Api.Endpoints;

public static class DebugEndpoints
{
    public static void MapDebugEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/explore-request-headers", async (HttpRequest request) =>
        {
            // Читаем заголовки
            var headers = request.Headers.ToDictionary(
                h => h.Key,
                h => h.Value.ToString()
            );

            // Читаем тело как строку (можно прочитать только один раз!)
            string body;
            using (var reader = new StreamReader(request.Body))
            {
                body = await reader.ReadToEndAsync();
            }

            // Логируем или анализируем
            Console.WriteLine($"Headers: {System.Text.Json.JsonSerializer.Serialize(headers)}");
            Console.WriteLine($"Body: {body}");

            return Results.Ok(new { message = "Request received", headers, body });
        });
    }
}
