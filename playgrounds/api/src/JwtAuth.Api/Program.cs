using JwtAuth.Api.Configuration;
using JwtAuth.Api.Endpoints;
using JwtAuth.Api.Models;
using JwtAuth.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Привязка конфигурации
var jwtSettings = builder.Configuration
    .GetSection(nameof(JwtSettings))
    .Get<JwtSettings>() ?? throw new Exception("JWT settings missing");

var corsSettings = builder.Configuration
    .GetSection(nameof(CorsSettings))
    .Get<CorsSettings>() ?? throw new Exception("CORS settings missing");

// Регистрация настроек, сервисов и "in-memory" хранилища в DI контейнер
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton(new ConcurrentDictionary<string, RefreshTokenRecord>());

// Аутентификация & Авторизация
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// CORS для Vue
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsSettings.PolicyName, policy =>
    {
        policy.WithOrigins(corsSettings.Origins);

        if (corsSettings.AllowAnyHeader)
            policy.AllowAnyHeader();

        if (corsSettings.AllowAnyMethod)
            policy.AllowAnyMethod();

        if (corsSettings.AllowCredentials)
            policy.AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors(corsSettings.PolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapApiEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapDebugEndpoints();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
