package handlers

import (
	"context"
	"strings"
	"time"

	"portfolio-backend/config"
	"portfolio-backend/middleware"
	"portfolio-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func users() *mongo.Collection {
	return config.DB.Collection("users")
}

func createToken(userID primitive.ObjectID) (string, error) {
	claims := jwt.MapClaims{
		"_id": userID.Hex(),
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.Secret))
}

type signupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Signup(c *fiber.Ctx) error {
	var req signupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "All fields are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existing models.User
	err := users().FindOne(ctx, bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Email already registered"})
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	now := time.Now()
	user := models.User{
		Name:       req.Name,
		Email:      req.Email,
		Password:   string(hashed),
		Subscribed: false,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	result, err := users().InsertOne(ctx, user)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	user.ID = result.InsertedID.(primitive.ObjectID)

	token, err := createToken(user.ID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"_id":        user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"subscribed": user.Subscribed,
		"token":      token,
	})
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email and password are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := users().FindOne(ctx, bson.M{"email": strings.TrimSpace(strings.ToLower(req.Email))}).Decode(&user)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	token, err := createToken(user.ID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"_id":        user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"subscribed": user.Subscribed,
		"token":      token,
	})
}

func GetProfile(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	return c.JSON(fiber.Map{
		"_id":        user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"subscribed": user.Subscribed,
		"createdAt":  user.CreatedAt,
		"updatedAt":  user.UpdatedAt,
	})
}

func Subscribe(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	after := options.After
	var updated models.User
	err := users().FindOneAndUpdate(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"subscribed": true, "updatedAt": time.Now()}},
		&options.FindOneAndUpdateOptions{ReturnDocument: &after},
	).Decode(&updated)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Subscription activated",
		"user": fiber.Map{
			"_id":        updated.ID,
			"name":       updated.Name,
			"email":      updated.Email,
			"subscribed": updated.Subscribed,
		},
	})
}

type passwordResetRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func PasswordReset(c *fiber.Ctx) error {
	var req passwordResetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email and new password are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := users().FindOne(ctx, bson.M{"email": strings.TrimSpace(strings.ToLower(req.Email))}).Decode(&user)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	_, err = users().UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{
		"$set": bson.M{"password": string(hashed), "updatedAt": time.Now()},
	})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	token, err := createToken(user.ID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"_id":        user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"subscribed": user.Subscribed,
		"token":      token,
	})
}
