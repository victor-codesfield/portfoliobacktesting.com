package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PortfolioGeneration struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID            primitive.ObjectID `bson:"user_id" json:"user_id"`
	Name              string             `bson:"name" json:"name"`
	Tickers           []string           `bson:"tickers" json:"tickers"`
	AllocationRatios  []float64          `bson:"allocation_ratios" json:"allocation_ratios"`
	MonthlyInvestment float64            `bson:"monthly_investment" json:"monthly_investment"`
	Years             *int               `bson:"years,omitempty" json:"years,omitempty"`
	StartDate         *time.Time         `bson:"start_date,omitempty" json:"start_date,omitempty"`
	EndDate           *time.Time         `bson:"end_date,omitempty" json:"end_date,omitempty"`
	RebalanceFrequency string             `bson:"rebalance_frequency" json:"rebalance_frequency"`
	AnalysisData      interface{}        `bson:"analysis_data" json:"analysis_data"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}
