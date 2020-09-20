package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/dghubble/go-twitter/twitter"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
)

func main() {
	TwitterAPIKey := os.Getenv("TWITTER_API_KEY")
	TwitterAPIKeySecret := os.Getenv("TWITTER_API_KEY_SECRET")

	twitterClient := initTwitterClient(TwitterAPIKey, TwitterAPIKeySecret)
	search, _, err := twitterClient.Search.Tweets(&twitter.SearchTweetParams{
		Query: "gopher",
	})
	if err != nil {
		panic(err)
	}

	fmt.Println(search)

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", hello)

	e.Logger.Fatal(e.Start(":1323"))
}

func initTwitterClient(twitterAPIKey, twitterAPIKeySecret string) *twitter.Client {
	config := &clientcredentials.Config{
		ClientID:     twitterAPIKey,
		ClientSecret: twitterAPIKeySecret,
		TokenURL:     "https://api.twitter.com/oauth2/token",
	}

	httpClient := config.Client(oauth2.NoContext)
	twitterClient := twitter.NewClient(httpClient)

	return twitterClient
}

func hello(c echo.Context) error {
	return c.String(http.StatusOK, "Hello, World!")
}
