import * as functions from 'firebase-functions';
import {
  initTwitterClient,
  aysncSearchTweets,
  Tweet,
  TweetAuthor,
  TweetImage
} from './twitter';

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

export const akikunChanArts = functions.region("asia-northeast1").https.onRequest(async (req, res) => {
  functions.logger.info("Hello logs!", {structuredData: true});

  if (req.method === "GET") {
    try {
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
          const creator: TweetAuthor = {
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
            url: `https://twitter.com/${creator.screenName}/status/${tweet.id_str}`,
            text: tweet.full_text,
            creator,
            images,
            createdAt: new Date(tweet.created_at),
          };
        });

      res.status(200).json(tweets);
    } catch (err) {
      functions.logger.error(err, {structuredData: true});
      res.sendStatus(500);
    }
  }
});