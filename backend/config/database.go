package config

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(AppConfig.MongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}

	DB = client.Database("PortfolioModeller")
	log.Println("Connected to MongoDB")
}

func PingDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return DB.Client().Ping(ctx, nil)
}
