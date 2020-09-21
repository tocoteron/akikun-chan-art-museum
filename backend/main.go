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

// TwitterClientContext is a custom context to inject twitter client
type TwitterClientContext struct {
	echo.Context
	TwitterClient *twitter.Client
}

// TwitterAPIMiddleware injects twitter client to context
func TwitterAPIMiddleware(twitterClient *twitter.Client) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			twitterAPIContext := &TwitterClientContext{
				Context:       c,
				TwitterClient: twitterClient,
			}
			return next(twitterAPIContext)
		}
	}
}

func main() {
	TwitterAPIKey := os.Getenv("TWITTER_API_KEY")
	TwitterAPIKeySecret := os.Getenv("TWITTER_API_KEY_SECRET")

	twitterClient := initTwitterClient(TwitterAPIKey, TwitterAPIKeySecret)

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	twitterAPIMiddleware := TwitterAPIMiddleware(twitterClient)
	e.GET("/images", getImages, twitterAPIMiddleware)

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

func getImages(c echo.Context) error {
	type Image struct {
		URL    string `json:"url"`
		Width  int    `json:"width"`
		Height int    `json:"height"`
	}
	type TweetImages struct {
		TweetURL       string  `json:"tweetURL"`
		TweetID        string  `json:"tweetID"`
		UserScreenName string  `json:"userScreenName"`
		Images         []Image `json:"images"`
	}
	type Response = []TweetImages

	tcc := c.(*TwitterClientContext)

	search, _, err := tcc.TwitterClient.Search.Tweets(&twitter.SearchTweetParams{
		TweetMode: "extended",
		Query:     "#アキくんちゃんアート exclude:retweets",
		Count:     100,
	})
	if err != nil {
		return err
	}

	res := Response{}

	for _, tweet := range search.Statuses {
		tweetURL := fmt.Sprintf(
			"https://twitter.com/%s/status/%s",
			tweet.User.ScreenName,
			tweet.IDStr,
		)
		if tweet.ExtendedEntities != nil {
			images := []Image{}
			for _, media := range tweet.ExtendedEntities.Media {
				images = append(images, Image{
					URL:    media.MediaURLHttps,
					Width:  media.Sizes.Large.Width,
					Height: media.Sizes.Large.Height,
				})
			}

			res = append(res, TweetImages{
				TweetURL:       tweetURL,
				TweetID:        tweet.IDStr,
				UserScreenName: tweet.User.ScreenName,
				Images:         images,
			})
		}
	}

	return c.JSON(http.StatusOK, res)
}
