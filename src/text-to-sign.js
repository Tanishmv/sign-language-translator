import React, { useState } from 'react';
import './text-to-sign.css';
import { useNavigate } from 'react-router-dom';

function Translator() {
  const [inputText, setInputText] = useState('');
  const [translatedSigns, setTranslatedSigns] = useState([]);
  const [displayedWords, setDisplayedWords] = useState([]);
  const navigate = useNavigate();

  const navigateToTranslator = () => {
    navigate('/');  // Navigate to the '/' route
  };

  // Define filler words
  const fillerWords = ['is', 'the', 'a', 'of', 'to', 'on', 'at', 'are', 'did'];

  // Mapping words to the same sign (e.g., "doing" -> "do")
  const wordMapping = {
    "accompanying": "accompany",
    "admitting": "admit",
    "agrees": "agree",
    "agreed": "agree",  // "agreed" mapped to "agree"
    "angering": "angry",  // "angering" mapped to "angry"
    "angered": "angry",   // "angered" mapped to "angry"
    "anger": "angry",     // "anger" mapped to "angry"
    "alcoholic": "alcohol",
    "approximating": "approximately",
    "arriving": "arrive",
    "asked": "ask",
    "asking": "ask",
    "backed": "back",
    "balls": "ball",
    "barbered": "barber",
    "becomes": "become",
    "being": "be",
    "birds": "bird",
    "blues": "blue",
    "boys": "boy",
    "brotherly": "brother",
    "bro": "brother",
    "canceled": "cancel",
    "cats": "cat",
    "causes": "cause",
    "children": "child",
    "chocolates": "chocolate",
    "crying": "cry",
    "dads": "dad",
    "days": "day",
    "differ": "different",
    "dining": "dinner",
    "doing": "do",  // "doing" mapped to "do"
    "dogged": "dog",
    "excused": "excuse",
    "engineering": "engineer",
    "feelings": "feel",
    "fines": "fine",
    "finished": "finish",
    "fridays": "friday",
    "friends": "friend",
    "girls": "girl",
    "good": "good",  // "good" mapped to "good"
    "grandmas": "grandma",
    "grandpas": "grandpa",
    "greeny": "green",
    "happiness": "happy",
    "helpers": "help",
    "hi": "hello",
    "homes": "home",
    "horses": "horse",
    "hott": "hot",  // "hott" mapped to "hot"
    "hungry": "hungry",
    "ifs": "if",
    "inside": "inside",
    "liking": "like",
    "loved": "love",
    "lunches": "lunch",
    "mothers": "mom",
    "monday": "monday",  // "monday" mapped to "monday"
    "months": "month",
    "nights": "night",
    "oranges": "orange",
    "okay": "ok",
    "outs": "out",
    "requests": "request",
    "saddened": "sad",  // "saddened" mapped to "sad"
    "sames": "same",
    "saturdays": "saturday",
    "schools": "school",
    "sisters": "sister",
    "sometime": "someimes",
    "stands": "stand",
    "stops": "stop",
    "stores": "store",
    "thank": "thanks",  // "thanks" mapped to "thanks"
    "thursdays": "thursday",
    "todays": "today",
    "tomorrows": "tomorrow",
    "tuesdays": "tuesday",
    "uncled": "uncle",
    "weathers": "weather",
    "wednesdays": "wednesday",
    "weeks": "week",
    "welcomes": "welcome",
    "whats": "what",  // "whats" mapped to "what"
    "whens": "when",  // "whens" mapped to "when"
    "wheres": "where",  // "wheres" mapped to "where"
    "whos": "who",  // "whos" mapped to "who"
    "whys": "why",  // "whys" mapped to "why"
    "works": "work",
    "yours": "your",  // "yours" mapped to "your"
    "finishing": "finish",  // "finishing" mapped to "finish"
    "helping": "help",  // "helping" mapped to "help"
    "living": "live",  // "living" mapped to "live"
    "seeing": "see",  // "seeing" mapped to "see"
    "talking": "talk",  // "talking" mapped to "talk"
    "waiting": "wait",  // "waiting" mapped to "wait"
  };
  

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // Clean the input text by removing filler words and punctuation
  const cleanText = (text) => {
    const cleanedText = text.replace(/[.,/#!?$%^&*;:{}=\-_`~()]/g, '');
    return cleanedText.split(' ').filter(word => !fillerWords.includes(word.toLowerCase()));
  };

  // Function to get a sign image for a word
  const getSignImage = (word) => {
    // Use the mapping to find the canonical word (e.g., "doing" becomes "do")
    const canonicalWord = wordMapping[word.toLowerCase()] || word.toLowerCase();

    const possibleFormats = ['gif', 'png', 'jpg', 'jpeg', 'svg'];
    for (let format of possibleFormats) {
      try {
        const signImage = require(`./dictionary/${canonicalWord}.${format}`);
        return signImage;
      } catch (error) {
        continue;
      }
    }
    return null;
  };

  // Function for finger-spelling a word if not found in the dictionary
  const getFingerSpellingImages = (word) => {
    const fingerSpellingImages = [];
    for (let char of word.toLowerCase()) {
      if ((char >= 'a' && char <= 'z') || (char>=0 && char<=9)) {
        try {
          const letterImage = require(`./dictionary/${char}.jpg`);
          fingerSpellingImages.push(letterImage);
        } catch (error) {
          fingerSpellingImages.push(null);  // If no image for the letter, use null
        }
      }
    }
    return fingerSpellingImages;
  };

  // Function to translate the input text
  const translateToSignLanguage = () => {
    const words = cleanText(inputText);
    const signImages = words.map((word) => {
      const wordImage = getSignImage(word);
      if (wordImage) {
        return wordImage;
      } else {
        return getFingerSpellingImages(word);  // Return finger-spelling images for unknown words
      }
    });

    setTranslatedSigns(signImages);
    setDisplayedWords(words);
  };

  return (
    <div className="App">
      <h1>Text to Sign Language Translator</h1>

      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter text to translate"
      />

      <button onClick={translateToSignLanguage} style={{ marginLeft: '10px' }}>
        Translate
      </button>

      <div className="translated-signs">
        {translatedSigns.length > 0 ? (
          translatedSigns.map((sign, index) => (
            <div className="translated-sign" key={index}>
              {Array.isArray(sign) ? (
                // If it's finger-spelling, group the images together for one word
                <div className="finger-spelling-group">
                  {sign.map((letterImage, letterIndex) => (
                    letterImage ? (
                      <img
                        key={letterIndex}
                        src={letterImage}
                        alt={`finger-spelling-${letterIndex}`}
                        className="sign-image"
                      />
                    ) : (
                      <span key={letterIndex}>[No image for letter]</span>
                    )
                  ))}
                </div>
              ) : (
                // If it's a regular sign, display it as an image
                <img
                  src={sign}
                  alt={`sign-${index}`}
                  className="sign-image"
                />
              )}
              <span>{displayedWords[index]}</span>
            </div>
          ))
        ) : (
          <p>No translation available</p>
        )}
      </div>

      <button
        onClick={navigateToTranslator}
        style={{ padding: '10px', fontSize: '16px', marginTop: '30px' }}>
        Sign to Text Translator
      </button>
    </div>
  );
}

export default Translator;
