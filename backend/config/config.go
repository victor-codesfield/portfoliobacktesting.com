package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	MongoURI         string
	Secret           string
	AdminAccountIDs  []string
}

var AppConfig Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env vars")
	}

	AppConfig = Config{
		Port:     getEnv("PORT", "4000"),
		MongoURI: getEnv("MONGODB_URI", ""),
		Secret:   getEnv("SECRET", ""),
		AdminAccountIDs: collectAdminIDs(),
	}

	if AppConfig.MongoURI == "" {
		log.Fatal("MONGODB_URI is required")
	}
	if AppConfig.Secret == "" {
		log.Fatal("SECRET is required")
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func collectAdminIDs() []string {
	var ids []string
	for i := 1; i <= 4; i++ {
		key := "ADMIN_DEV_ACCOUNT_ID_" + string(rune('0'+i))
		if val := os.Getenv(key); val != "" {
			ids = append(ids, val)
		}
	}
	return ids
}
