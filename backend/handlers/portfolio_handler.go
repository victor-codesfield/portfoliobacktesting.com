package handlers

import (
	"context"
	"math"
	"time"

	"portfolio-backend/config"
	"portfolio-backend/data"
	"portfolio-backend/middleware"
	"portfolio-backend/models"
	"portfolio-backend/services"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func portfolios() *mongo.Collection {
	return config.DB.Collection("portfoliogenerations")
}

func GetAssets(c *fiber.Ctx) error {
	assets := data.GetAssetsByCategory()
	return c.JSON(fiber.Map{"assets": assets})
}

func SearchTickerHandler(c *fiber.Ctx) error {
	q := c.Query("q")
	if q == "" || len(q) > 20 {
		return c.Status(400).JSON(fiber.Map{"error": "Query parameter 'q' is required (max 20 chars)"})
	}

	result := services.SearchTicker(q)
	return c.JSON(result)
}

type validateRequest struct {
	Tickers   []string   `json:"tickers"`
	Years     *int       `json:"years"`
	DateRange *dateRange `json:"dateRange"`
}

type dateRange struct {
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

func parseYearsOrDateRange(years *int, dr *dateRange) (services.YearsOrDateRange, float64, error) {
	if years != nil && dr != nil {
		return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Cannot provide both years and dateRange")
	}
	if years == nil && dr == nil {
		return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Either years or dateRange is required")
	}

	if years != nil {
		validYears := []int{1, 2, 5, 10, 20, 30}
		valid := false
		for _, vy := range validYears {
			if *years == vy {
				valid = true
				break
			}
		}
		if !valid {
			return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Years must be 1, 2, 5, 10, 20, or 30")
		}
		return services.YearsOrDateRange{Years: years}, float64(*years), nil
	}

	if dr.StartDate == "" || dr.EndDate == "" {
		return services.YearsOrDateRange{}, 0, fiber.NewError(400, "dateRange must have both startDate and endDate")
	}

	startDate, err := time.Parse(time.RFC3339, dr.StartDate)
	if err != nil {
		startDate, err = time.Parse("2006-01-02", dr.StartDate)
		if err != nil {
			return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Invalid startDate format")
		}
	}

	endDate, err := time.Parse(time.RFC3339, dr.EndDate)
	if err != nil {
		endDate, err = time.Parse("2006-01-02", dr.EndDate)
		if err != nil {
			return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Invalid endDate format")
		}
	}

	if !startDate.Before(endDate) {
		return services.YearsOrDateRange{}, 0, fiber.NewError(400, "startDate must be before endDate")
	}

	yearsValue := endDate.Sub(startDate).Hours() / (24 * 365.25)
	if yearsValue > 30 {
		return services.YearsOrDateRange{}, 0, fiber.NewError(400, "Date range cannot exceed 30 years")
	}

	return services.YearsOrDateRange{
		DateRange: &services.DateRange{StartDate: startDate, EndDate: endDate},
	}, yearsValue, nil
}

func ValidateTickers(c *fiber.Ctx) error {
	var req validateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(req.Tickers) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Tickers array is required"})
	}
	if len(req.Tickers) > 10 {
		return c.Status(400).JSON(fiber.Map{"error": "Maximum of 10 tickers allowed"})
	}

	yod, _, err := parseYearsOrDateRange(req.Years, req.DateRange)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	result := services.ValidateTickerDataAvailability(req.Tickers, yod)
	return c.JSON(result)
}

type analyzeRequest struct {
	Tickers            []string   `json:"tickers"`
	AllocationRatios   []float64  `json:"allocation_ratios"`
	MonthlyInvestment  float64    `json:"monthly_investment"`
	Years              *int       `json:"years"`
	DateRange          *dateRange `json:"dateRange"`
	RebalanceFrequency string     `json:"rebalance_frequency"`
	MonteCarlo         bool       `json:"monte_carlo"`
	Name               string     `json:"name"`
	// Legacy field for backward compat
	RebalanceAnnually  *bool      `json:"rebalance_annually,omitempty"`
}

func AnalyzePortfolio(c *fiber.Ctx) error {
	var req analyzeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(req.Tickers) == 0 || len(req.AllocationRatios) == 0 || req.MonthlyInvestment == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
	}

	if req.MonthlyInvestment < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Monthly investment must be positive"})
	}

	if len(req.Tickers) != len(req.AllocationRatios) {
		return c.Status(400).JSON(fiber.Map{"error": "Tickers and allocation_ratios must have the same length"})
	}

	ratioSum := 0.0
	for _, r := range req.AllocationRatios {
		if r < 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Allocation ratios must be non-negative"})
		}
		ratioSum += r
	}
	if math.Abs(ratioSum-1.0) > 0.001 {
		return c.Status(400).JSON(fiber.Map{"error": "Allocation ratios must sum to 1.0"})
	}

	if len(req.Tickers) > 10 {
		return c.Status(400).JSON(fiber.Map{"error": "Maximum of 10 tickers allowed"})
	}

	yod, _, err := parseYearsOrDateRange(req.Years, req.DateRange)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	user := middleware.GetUser(c)

	// Resolve rebalance frequency (support legacy rebalance_annually field)
	rebalanceFreq := req.RebalanceFrequency
	if rebalanceFreq == "" && req.RebalanceAnnually != nil && *req.RebalanceAnnually {
		rebalanceFreq = "annual"
	}
	if rebalanceFreq == "" {
		rebalanceFreq = "none"
	}
	if rebalanceFreq != "none" && rebalanceFreq != "annual" && rebalanceFreq != "quarterly" {
		return c.Status(400).JSON(fiber.Map{"error": "rebalance_frequency must be 'none', 'annual', or 'quarterly'"})
	}

	analysisResult, err := services.AnalyzePortfolio(req.Tickers, req.AllocationRatios, req.MonthlyInvestment, yod, rebalanceFreq, req.MonteCarlo)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	existingCount, _ := portfolios().CountDocuments(ctx, bson.M{"user_id": user.ID})

	var generation interface{}
	if existingCount < 10 {
		now := time.Now()
		name := req.Name
		if name == "" {
			name = "Portfolio " + primitive.NewObjectID().Hex()[:4]
		}

		gen := models.PortfolioGeneration{
			UserID:             user.ID,
			Name:               name,
			Tickers:            req.Tickers,
			AllocationRatios:   req.AllocationRatios,
			MonthlyInvestment:  req.MonthlyInvestment,
			RebalanceFrequency: rebalanceFreq,
			AnalysisData:       analysisResult,
			CreatedAt:          now,
			UpdatedAt:          now,
		}

		if req.Years != nil {
			gen.Years = req.Years
		} else if req.DateRange != nil {
			startDate, _ := time.Parse(time.RFC3339, req.DateRange.StartDate)
			if startDate.IsZero() {
				startDate, _ = time.Parse("2006-01-02", req.DateRange.StartDate)
			}
			endDate, _ := time.Parse(time.RFC3339, req.DateRange.EndDate)
			if endDate.IsZero() {
				endDate, _ = time.Parse("2006-01-02", req.DateRange.EndDate)
			}
			gen.StartDate = &startDate
			gen.EndDate = &endDate
		}

		result, insertErr := portfolios().InsertOne(ctx, gen)
		if insertErr == nil {
			gen.ID = result.InsertedID.(primitive.ObjectID)
			generation = gen
		}
	}

	return c.JSON(fiber.Map{
		"analysis":   analysisResult,
		"generation": generation,
		"message":    "Analysis completed successfully",
	})
}

func GetGenerations(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "updated_at", Value: -1}})
	cursor, err := portfolios().Find(ctx, bson.M{"user_id": user.ID}, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching generations"})
	}
	defer cursor.Close(ctx)

	var generations []models.PortfolioGeneration
	if err := cursor.All(ctx, &generations); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching generations"})
	}

	if generations == nil {
		generations = []models.PortfolioGeneration{}
	}

	return c.JSON(fiber.Map{
		"generations": generations,
		"count":       len(generations),
	})
}

func GetGeneration(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	genID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid generation ID"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var gen models.PortfolioGeneration
	err = portfolios().FindOne(ctx, bson.M{"_id": genID, "user_id": user.ID}).Decode(&gen)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Generation not found"})
	}

	return c.JSON(fiber.Map{"generation": gen})
}

func UpdateGeneration(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	genID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid generation ID"})
	}

	var req analyzeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get existing generation
	var existing models.PortfolioGeneration
	err = portfolios().FindOne(ctx, bson.M{"_id": genID, "user_id": user.ID}).Decode(&existing)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Generation not found"})
	}

	// Build update
	update := bson.M{"updated_at": time.Now()}

	if req.Name != "" {
		update["name"] = req.Name
	}
	if len(req.Tickers) > 0 {
		if len(req.Tickers) > 10 {
			return c.Status(400).JSON(fiber.Map{"error": "Maximum of 10 tickers allowed"})
		}
		if len(req.Tickers) != len(req.AllocationRatios) {
			return c.Status(400).JSON(fiber.Map{"error": "Tickers and allocation_ratios must have the same length"})
		}
		ratioSum := 0.0
		for _, r := range req.AllocationRatios {
			ratioSum += r
		}
		if math.Abs(ratioSum-1.0) > 0.001 {
			return c.Status(400).JSON(fiber.Map{"error": "Allocation ratios must sum to 1.0"})
		}
		update["tickers"] = req.Tickers
		update["allocation_ratios"] = req.AllocationRatios
	}
	if req.MonthlyInvestment > 0 {
		update["monthly_investment"] = req.MonthlyInvestment
	}

	if req.Years != nil {
		update["years"] = *req.Years
		update["start_date"] = nil
		update["end_date"] = nil
	} else if req.DateRange != nil {
		startDate, _ := time.Parse(time.RFC3339, req.DateRange.StartDate)
		if startDate.IsZero() {
			startDate, _ = time.Parse("2006-01-02", req.DateRange.StartDate)
		}
		endDate, _ := time.Parse(time.RFC3339, req.DateRange.EndDate)
		if endDate.IsZero() {
			endDate, _ = time.Parse("2006-01-02", req.DateRange.EndDate)
		}
		update["start_date"] = startDate
		update["end_date"] = endDate
		update["years"] = nil
	}

	// Resolve rebalance frequency (support legacy field)
	rebalanceFreq := req.RebalanceFrequency
	if rebalanceFreq == "" && req.RebalanceAnnually != nil && *req.RebalanceAnnually {
		rebalanceFreq = "annual"
	}
	if rebalanceFreq == "" {
		rebalanceFreq = "none"
	}
	update["rebalance_frequency"] = rebalanceFreq

	_, err = portfolios().UpdateOne(ctx, bson.M{"_id": genID, "user_id": user.ID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error updating generation"})
	}

	// Re-fetch the updated generation
	var updated models.PortfolioGeneration
	_ = portfolios().FindOne(ctx, bson.M{"_id": genID, "user_id": user.ID}).Decode(&updated)

	// Re-run analysis if key fields changed
	needsReanalysis := len(req.Tickers) > 0 || len(req.AllocationRatios) > 0 || req.MonthlyInvestment > 0 || req.Years != nil || req.DateRange != nil

	if needsReanalysis {
		var yod services.YearsOrDateRange
		if updated.Years != nil {
			yod = services.YearsOrDateRange{Years: updated.Years}
		} else if updated.StartDate != nil && updated.EndDate != nil {
			yod = services.YearsOrDateRange{DateRange: &services.DateRange{StartDate: *updated.StartDate, EndDate: *updated.EndDate}}
		} else {
			defaultYears := 2
			yod = services.YearsOrDateRange{Years: &defaultYears}
		}

		rebalFreq := updated.RebalanceFrequency
		if rebalFreq == "" {
			rebalFreq = "none"
		}
		analysisResult, analysisErr := services.AnalyzePortfolio(updated.Tickers, updated.AllocationRatios, updated.MonthlyInvestment, yod, rebalFreq, req.MonteCarlo)
		if analysisErr == nil {
			portfolios().UpdateOne(ctx, bson.M{"_id": genID}, bson.M{"$set": bson.M{"analysis_data": analysisResult}})
			updated.AnalysisData = analysisResult
		}
	}

	return c.JSON(fiber.Map{
		"generation": updated,
		"message":    "Generation updated successfully",
	})
}

func DeleteGeneration(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	genID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid generation ID"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := portfolios().DeleteOne(ctx, bson.M{"_id": genID, "user_id": user.ID})
	if err != nil || result.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Generation not found"})
	}

	return c.JSON(fiber.Map{"message": "Generation deleted successfully"})
}

func ExportCSV(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	genID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid generation ID"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var gen models.PortfolioGeneration
	err = portfolios().FindOne(ctx, bson.M{"_id": genID, "user_id": user.ID}).Decode(&gen)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Generation not found"})
	}

	if gen.AnalysisData == nil {
		return c.Status(400).JSON(fiber.Map{"error": "No analysis data available for this generation"})
	}

	rebalFreq := gen.RebalanceFrequency
	if rebalFreq == "" {
		rebalFreq = "none"
	}

	// Convert analysis data to map for CSV generation
	analysisMap, ok := gen.AnalysisData.(primitive.D)
	if !ok {
		// Try as map
		if m, ok2 := gen.AnalysisData.(map[string]interface{}); ok2 {
			csvContent := services.GeneratePortfolioCSV(m, gen.MonthlyInvestment, rebalFreq)
			c.Set("Content-Type", "text/csv")
			c.Set("Content-Disposition", "attachment; filename=\"portfolio_export.csv\"")
			return c.SendString(csvContent)
		}
		return c.Status(500).JSON(fiber.Map{"error": "Invalid analysis data format"})
	}

	// Convert primitive.D to map
	analysisDataMap := bsonDToMap(analysisMap)
	csvContent := services.GeneratePortfolioCSV(analysisDataMap, gen.MonthlyInvestment, rebalFreq)

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=\"portfolio_export.csv\"")
	return c.SendString(csvContent)
}

func bsonDToMap(d primitive.D) map[string]interface{} {
	m := make(map[string]interface{})
	for _, elem := range d {
		switch v := elem.Value.(type) {
		case primitive.D:
			m[elem.Key] = bsonDToMap(v)
		case primitive.A:
			m[elem.Key] = bsonAToSlice(v)
		default:
			m[elem.Key] = v
		}
	}
	return m
}

func bsonAToSlice(a primitive.A) []interface{} {
	s := make([]interface{}, len(a))
	for i, elem := range a {
		switch v := elem.(type) {
		case primitive.D:
			s[i] = bsonDToMap(v)
		case primitive.A:
			s[i] = bsonAToSlice(v)
		default:
			s[i] = v
		}
	}
	return s
}
