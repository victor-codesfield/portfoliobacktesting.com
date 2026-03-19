package middleware

import (
	"context"
	"strings"
	"time"

	"portfolio-backend/config"
	"portfolio-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func RequireAuth(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Authorization required"})
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token format"})
	}

	tokenStr := parts[1]
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.Secret), nil
	})

	if err != nil {
		if strings.Contains(err.Error(), "expired") {
			return c.Status(401).JSON(fiber.Map{"error": "Session expired"})
		}
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	userIDStr, ok := claims["_id"].(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = config.DB.Collection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "User not found"})
	}

	c.Locals("user", &user)
	return c.Next()
}

func GetUser(c *fiber.Ctx) *models.User {
	user, _ := c.Locals("user").(*models.User)
	return user
}

func IsAdmin(userID string) bool {
	for _, id := range config.AppConfig.AdminAccountIDs {
		if id == userID {
			return true
		}
	}
	return false
}
