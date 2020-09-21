import * as functions from 'firebase-functions';
import {
  initTwitterClient,
  getAkikunChanArtTweets,
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

export const getAkikunChanArts = functions.region("asia-northeast1").https.onCall(async (data, context) => {
  functions.logger.info("/getAkikunChanArts", {structuredData: true});

  try {
    const tweets = await getAkikunChanArtTweets(twitterClient);
    return tweets;
  } catch (err) {
    functions.logger.error(err, {structuredData: true});
    throw new functions.https.HttpsError("internal", err);
  }
});