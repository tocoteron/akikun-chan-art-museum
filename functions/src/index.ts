import * as functions from 'firebase-functions';
import * as cors from 'cors';
import {
  initTwitterClient,
  aysncSearchTweets,
  Tweet,
  TweetAuthor,
  TweetImage
} from './twitter';

const corsHandler = cors({ origin: true });

const twitterClient = initTwitterClient(
  functions.config().twitter.apikey,
  functions.config().twitter.apikeysecret,
  functions.config().twitter.bearertoken
);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const helloWorld = functions.region("asia-northeast1").https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase 2!");
});

async function getTweets(): Promise<Tweet[]> {
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

export const akikunChanArts = functions.region("asia-northeast1").https.onRequest(async (req, res) => {
  functions.logger.info("/akikunChanArts", {structuredData: true});

  corsHandler(req, res, async () => {
    try {
      if (req.method === "GET") {
        const tweets = await getTweets();
        res.status(200).json(tweets);
      }
    } catch (err) {
      functions.logger.error(err, {structuredData: true});
      res.sendStatus(500);
    }
  });
});