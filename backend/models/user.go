package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Name       string             `bson:"name" json:"name"`
	Email      string             `bson:"email" json:"email"`
	Password   string             `bson:"password" json:"-"`
	Subscribed bool               `bson:"subscribed" json:"subscribed"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt" json:"updatedAt"`
}
