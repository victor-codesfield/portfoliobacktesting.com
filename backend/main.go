package main

import (
	"log"

	"portfolio-backend/config"
	"portfolio-backend/handlers"
	"portfolio-backend/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/helmet"
)

func main() {
	config.Load()
	config.ConnectDB()

	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024, // 10MB
	})

	// Security headers
	app.Use(helmet.New())

	// CORS
	middleware.SetupCORS(app)

	// Request logging
	app.Use(middleware.Logger)

	// Health checks
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "Portfolio Backend v2 (Go)"})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		dbStatus := "connected"
		if err := config.PingDB(); err != nil {
			dbStatus = "disconnected"
		}
		return c.JSON(fiber.Map{"status": "healthy", "database": dbStatus})
	})

	app.Get("/testConnection", func(c *fiber.Ctx) error {
		dbStatus := "connected"
		if err := config.PingDB(); err != nil {
			dbStatus = "error: " + err.Error()
		}
		return c.JSON(fiber.Map{
			"server":   "running",
			"database": dbStatus,
			"port":     config.AppConfig.Port,
		})
	})

	// User routes
	user := app.Group("/api/user")
	user.Post("/signup", handlers.Signup)
	user.Post("/login", handlers.Login)
	user.Post("/password-reset", handlers.PasswordReset)
	user.Get("/profile", middleware.RequireAuth, handlers.GetProfile)
	user.Post("/subscribe", middleware.RequireAuth, handlers.Subscribe)

	// Portfolio routes
	portfolio := app.Group("/api/portfolio")
	portfolio.Get("/assets", handlers.GetAssets)
	portfolio.Get("/search-ticker", handlers.SearchTickerHandler)
	portfolio.Post("/validate", middleware.RequireAuth, handlers.ValidateTickers)
	portfolio.Post("/analyze", middleware.RequireAuth, handlers.AnalyzePortfolio)
	portfolio.Get("/generations", middleware.RequireAuth, handlers.GetGenerations)
	portfolio.Get("/generations/:id", middleware.RequireAuth, handlers.GetGeneration)
	portfolio.Put("/generations/:id", middleware.RequireAuth, handlers.UpdateGeneration)
	portfolio.Delete("/generations/:id", middleware.RequireAuth, handlers.DeleteGeneration)
	portfolio.Get("/generations/:id/export-csv", middleware.RequireAuth, handlers.ExportCSV)

	// Blog routes
	blog := app.Group("/api/blog")
	blog.Get("/", handlers.GetBlogPosts)
	blog.Get("/:slug", handlers.GetBlogPost)
	blog.Post("/", middleware.RequireAuth, handlers.CreateBlogPost)
	blog.Put("/:slug", middleware.RequireAuth, handlers.UpdateBlogPost)
	blog.Delete("/:slug", middleware.RequireAuth, handlers.DeleteBlogPost)

	log.Printf("Server starting on port %s", config.AppConfig.Port)
	log.Fatal(app.Listen(":" + config.AppConfig.Port))
}
