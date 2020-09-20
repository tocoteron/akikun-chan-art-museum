import React, { useState } from 'react';

interface TweetImages {
  tweet_url: string;
  image_urls: string[];
}

function App() {
  const [tweetImages, setTweetImages] = useState<TweetImages[]>([]);

  return (
    <div className="App">
      <button
        onClick={async () => {
          const tweetImages = await fetch('http://localhost:1323/images');
          const json = await tweetImages.json();
          console.log(json);

          setTweetImages(json);
        }}
      >CLICK</button>
      <div>
      {
        tweetImages.map((tweetImage) => {
          return (
            <img
              key={tweetImage.image_urls[0]} 
              src={tweetImage.image_urls[0]}
              style={{borderRadius: 16}}
            />
          );
        })
      }
      </div>
    </div>
  );
}

export default App;
