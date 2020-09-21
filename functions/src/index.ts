import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  initTwitterClient,
  getAkikunChanArtTweets,
} from './twitter';

admin.initializeApp(functions.config().firebase);

const firestore = admin.firestore();

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

export const collectAkikunChanArts = functions.region("asia-northeast1").pubsub.schedule('every 1 minutes').onRun(async (context) => {
  functions.logger.info("/collectAkikunChanArts", {structuredData: true});

  try {
    const tweets = await getAkikunChanArtTweets(twitterClient);
    const tweetsRef = firestore.collection("tweets");

    tweets.forEach(tweet => {
      tweetsRef.doc(tweet.id).set(tweet);
    });
  } catch (err) {
    functions.logger.error(err, {structuredData: true});
  }

  return null;
});