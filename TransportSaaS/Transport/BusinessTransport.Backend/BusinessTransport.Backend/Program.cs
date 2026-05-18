using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. ДОБАВЛЯЕМ ПРАВИЛО CORS (Один раз)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // ListenAnyIP(5241) открывает сервер для внешних подключений
    serverOptions.ListenAnyIP(5241);
});

// Подключение БД
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=BusinessTransport.db"));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. ПРИМЕНЯЕМ ПРАВИЛО CORS (Только один раз и в правильном месте конвейера!)
app.UseCors("AllowReact");

app.UseAuthorization();
app.MapControllers();

app.Run();