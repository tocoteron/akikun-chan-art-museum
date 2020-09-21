import * as Twitter from 'twitter';

export interface TweetAuthor {
  id: string;
  name: string;
  screenName: string;
}

export interface TweetImage {
  url: string;
  width: number;
  height: number;
}

export interface Tweet {
  id: string;
  url: string;
  text: string;
  author: TweetAuthor;
  images: TweetImage[];
  createdAt: Date;
}

export function initTwitterClient(apiKey: string, apiKeySecret: string, bearerToken: string): Twitter {
  return new Twitter({
    consumer_key: apiKey,
    consumer_secret: apiKeySecret,
    bearer_token: bearerToken,
  });
}

export function aysncSearchTweets(twitterClient: Twitter, searchOption: Twitter.RequestParams): Promise<Twitter.ResponseData> {
  return new Promise((resolve, reject) => {
    twitterClient.get('search/tweets', searchOption, function(error, tweets) {
      if (error) {
        reject(error);
      }
      resolve(tweets);
    });
  });
}

export async function getAkikunChanArtTweets(twitterClient: Twitter): Promise<Tweet[]> {
  const searchRes = await aysncSearchTweets(twitterClient, {
    tweet_mode: "extended",
    q: "#アキくんちゃんアート exclude:retweets",
    count: 100,
  });

  const tweets: Tweet[] = searchRes.statuses
    .filter((tweet: any) => {
      return tweet.extended_entities && tweet.extended_entities.media;
    })
    .map((tweet: any) => {
      const author: TweetAuthor = {
        id: tweet.user.id_str,
        name: tweet.user.name,
        screenName: tweet.user.screen_name,
      }

      const images: TweetImage[] = tweet.extended_entities.media.map((image: any) => ({
        url: image.media_url_https,
        width: image.sizes.large.w,
        height: image.sizes.large.h,
      }));

      return {
        id: tweet.id_str,
        url: `https://twitter.com/${author.screenName}/status/${tweet.id_str}`,
        text: tweet.full_text,
        author,
        images,
        createdAt: new Date(tweet.created_at),
      };
    });

  return tweets;
}

