package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func SetupCORS(app *fiber.App) {
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, https://portfoliobacktesting.com, https://www.portfoliobacktesting.com, https://api.portfoliobacktesting.com",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type, Authorization, Origin, Accept, X-Requested-With, X-App-Name",
	}))
}
