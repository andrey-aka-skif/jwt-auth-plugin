namespace JwtAuth.Api.Configuration;

public class CorsSettings
{
    public string PolicyName { get; set; } = string.Empty;
    public string[] Origins { get; set; } = [];
    public bool AllowAnyHeader { get; set; }
    public bool AllowAnyMethod { get; set; }
    public bool AllowCredentials { get; set; }
}
