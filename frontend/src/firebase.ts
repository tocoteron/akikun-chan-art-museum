import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDuhty3_XEU1W5tDoxUxFpEsqER4hHgwTc",
  authDomain: "akikunwebproject.firebaseapp.com",
  databaseURL: "https://akikunwebproject.firebaseio.com",
  projectId: "akikunwebproject",
  storageBucket: "akikunwebproject.appspot.com",
  messagingSenderId: "10554477664",
  appId: "1:10554477664:web:bb5574eb8ed205574cc705"
};

const twitterProvider = new firebase.auth.TwitterAuthProvider();

const FirebaseFactory = () => {
  firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const firestore = firebase.firestore();
  const functions = firebase.app().functions("asia-northeast1");

  if (process.env.NODE_ENV === 'development') {
    functions.useFunctionsEmulator("http://localhost:5001");
  }

  return {
    auth() {
      return auth;
    },

    login() {
      return auth.signInWithPopup(twitterProvider);
    },

    logout() {
      return auth.signOut();
    },

    functions() {
      return functions;
    },

    firestore() {
      return firestore;
    }
  };
};

export default FirebaseFactory();