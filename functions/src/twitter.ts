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
