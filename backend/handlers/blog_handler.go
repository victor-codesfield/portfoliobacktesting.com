package handlers

import (
	"context"
	"regexp"
	"strings"
	"time"

	"portfolio-backend/config"
	"portfolio-backend/middleware"
	"portfolio-backend/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func blogs() *mongo.Collection {
	return config.DB.Collection("blogposts")
}

func GetBlogPosts(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := blogs().Find(ctx, bson.M{}, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching blog posts"})
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching blog posts"})
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return c.JSON(posts)
}

func GetBlogPost(c *fiber.Ctx) error {
	slug := c.Params("slug")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var post models.BlogPost
	err := blogs().FindOne(ctx, bson.M{"slug": slug}).Decode(&post)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Blog post not found"})
	}

	return c.JSON(post)
}

type blogRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Slug    string `json:"slug"`
}

var slugRegex = regexp.MustCompile(`^[a-z0-9-]+$`)

func CreateBlogPost(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if !middleware.IsAdmin(user.ID.Hex()) {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	var req blogRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Title == "" || req.Content == "" || req.Slug == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title, content, and slug are required"})
	}

	if len(req.Title) > 200 {
		return c.Status(400).JSON(fiber.Map{"error": "Title must be 200 characters or less"})
	}

	req.Slug = strings.ToLower(strings.TrimSpace(req.Slug))
	if !slugRegex.MatchString(req.Slug) {
		return c.Status(400).JSON(fiber.Map{"error": "Slug must contain only lowercase letters, numbers, and hyphens"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check slug uniqueness
	var existing models.BlogPost
	if err := blogs().FindOne(ctx, bson.M{"slug": req.Slug}).Decode(&existing); err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Slug already exists"})
	}

	now := time.Now()
	post := models.BlogPost{
		Title:     req.Title,
		Content:   req.Content,
		Slug:      req.Slug,
		UserID:    user.ID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := blogs().InsertOne(ctx, post)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error creating blog post"})
	}

	post.ID = result.InsertedID.(primitive.ObjectID)
	return c.Status(201).JSON(post)
}

func UpdateBlogPost(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if !middleware.IsAdmin(user.ID.Hex()) {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	slug := c.Params("slug")

	var req blogRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{"updatedAt": time.Now()}
	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Content != "" {
		update["content"] = req.Content
	}

	after := options.After
	var updated models.BlogPost
	err := blogs().FindOneAndUpdate(
		ctx,
		bson.M{"slug": slug},
		bson.M{"$set": update},
		&options.FindOneAndUpdateOptions{ReturnDocument: &after},
	).Decode(&updated)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Blog post not found"})
	}

	return c.JSON(updated)
}

func DeleteBlogPost(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if !middleware.IsAdmin(user.ID.Hex()) {
		return c.Status(403).JSON(fiber.Map{"error": "Admin access required"})
	}

	slug := c.Params("slug")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := blogs().DeleteOne(ctx, bson.M{"slug": slug})
	if err != nil || result.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Blog post not found"})
	}

	return c.JSON(fiber.Map{"message": "Blog post deleted successfully"})
}
