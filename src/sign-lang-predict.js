//working but the model itself not 
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tmImage from '@teachablemachine/image'; // Import Teachable Machine library
import '@tensorflow/tfjs'; // Import TensorFlow.js
import './sign-lang-predict.css'; // Import the CSS file for global styling
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import hand_landmarker_task from "./models/hand_landmarker.task";
import { useNavigate } from 'react-router-dom';  // Import useHistory hook



const WebcamPrediction = () => {
  const [models, setModels] = useState([]); // State to store multiple models
  const [currentModelIndex, setCurrentModelIndex] = useState(0); // State to store the index of the current model
  const [highestPrediction, setHighestPrediction] = useState(null);
  const [sentence, setSentence] = useState(''); // State to store the sentence
  const [loading, setLoading] = useState(true); // State to handle model loading
  const [isPredicting, setIsPredicting] = useState(false); // State to manage prediction status
  const videoRef = useRef(null); // Video reference for webcam feed
  const canvasRef = useRef(null); // Canvas to process the webcam image
  const canvasRef2 = useRef(null);
  const croppedCanvasRef = useRef(null); // Canvas to display the cropped hand region
  const [handPresence, setHandPresence] = useState(null);
  const previousPredictionRef = useRef('');

  const navigate = useNavigate();  // Access the history object

  // Function to handle button click
  const navigateToTranslator = () => {
    navigate('/text-to-sign');  // Navigate to '/translator' page
  };

  // Initialize hand detection
  const initializeHandDetection = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: hand_landmarker_task },
        numHands: 2,
        runningMode: "video"
      });
      return handLandmarker;
    } catch (error) {
      console.error("Error initializing hand detection:", error);
    }
  }, []);

  // Handle the webcam stream and start hand detection
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  }, []);

  // Load two Teachable Machine models
  const loadModels = useCallback(async () => {
    const modelURLs = [
      'https://teachablemachine.withgoogle.com/models/k_auIHR0H/model.json', // Model 1
      'https://teachablemachine.withgoogle.com/models/Def6WbJK5/model.json', // Model 2
      'https://teachablemachine.withgoogle.com/models/rpMQctbXi/model.json',
      'https://teachablemachine.withgoogle.com/models/9q-U49P4q/model.json',
      'https://teachablemachine.withgoogle.com/models/alL40WQv9H/model.json',
      'https://teachablemachine.withgoogle.com/models/gbCoBZfCo/model.json',
    ];
    const metadataURLs = [
      'https://teachablemachine.withgoogle.com/models/k_auIHR0H/metadata.json',
      'https://teachablemachine.withgoogle.com/models/Def6WbJK5/metadata.json',
      'https://teachablemachine.withgoogle.com/models/rpMQctbXi/metadata.json',
      'https://teachablemachine.withgoogle.com/models/9q-U49P4q/metadata.json',
      'https://teachablemachine.withgoogle.com/models/alL40WQv9H/metadata.json',
      'https://teachablemachine.withgoogle.com/models/gbCoBZfCo/metadata.json',
    ];

    try {
      const loadedModels = await Promise.all(modelURLs.map(async (modelURL, index) => {
        const model = await tmImage.load(modelURL, metadataURLs[index]);
        return { model, name: `Model ${index + 1}` }; // Add model name for tracking
      }));
      setModels(loadedModels);
      setLoading(false);
    } catch (error) {
      console.error('Error loading models:', error);
      setLoading(false);
    }
  }, []);

  const calculateDistance = (landmark1, landmark2) => {
    const xDiff = landmark1.x - landmark2.x;
    const yDiff = landmark1.y - landmark2.y;
    const zDiff = landmark1.z - landmark2.z;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
  };

  const isClosedFist = (landmarks) => {
    const thumbMiddleDistance = calculateDistance(landmarks[4], landmarks[12]); // Thumb to middle finger
    return thumbMiddleDistance < 0.1; // Threshold for closed fist (adjust as needed)
  };
  
  const isOpenPalm = (landmarks) => {
    const thumbMiddleDistance = calculateDistance(landmarks[4], landmarks[12]); // Thumb to middle finger
    return thumbMiddleDistance > 0.1; // Threshold for open palm (adjust as needed)
  };

  // const switchModelBasedOnGesture = (landmarks) => {

  //   if (!landmarks || landmarks.length < 21) {
  //     // Ensure there are enough landmarks to calculate the distance
  //     console.error("Insufficient landmarks detected.");
  //     return;
  //   }

  //   if (isClosedFist(landmarks)) {
  //     setCurrentModelIndex(0); // Use Model 1 for closed fist
  //   } else if (isOpenPalm(landmarks)) {
  //     setCurrentModelIndex(1); // Use Model 2 for open palm
  //   }
  // };
  

  // Hand landmark detection and drawing
  const drawLandmarks = (landmarksArray) => {
    const canvas = canvasRef.current; // Canvas for drawing landmarks
    const ctx = canvas.getContext('2d');
    
    // Clear canvas and set background to white
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; // Background color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas with white
    
    // Ensure landmarksArray has at least one hand's landmarks
    if (!landmarksArray || !landmarksArray[0]) return; // Prevent errors if landmarksArray or the first element is undefined
    
    const landmarks = landmarksArray[0]; // Get the first hand's landmarks
  
    // List of key connections to draw the skeleton (lines between landmarks)
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [9, 10], [10, 11], [11, 12],
      // Ring finger
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Knuckle connections
      [5, 9], [9, 13], [13, 17]
    ];
    
    // Draw the lines (skeleton) in green
    ctx.strokeStyle = '#00FF00'; // Set the color of the skeleton lines to green
    ctx.lineWidth = 2; // Set the line width
    connections.forEach(([start, end]) => {
      const startLandmark = landmarks[start]; // Get start landmark
      const endLandmark = landmarks[end]; // Get end landmark
      
      if (startLandmark && endLandmark) {
        const startX = startLandmark.x * canvas.width;
        const startY = startLandmark.y * canvas.height;
        const endX = endLandmark.x * canvas.width;
        const endY = endLandmark.y * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY); // Move to start point
        ctx.lineTo(endX, endY); // Draw line to end point
        ctx.stroke(); // Apply the drawing
      }
    });
    
    // Draw circles for the landmarks (optional, you can change the color if needed)
    ctx.fillStyle = 'red'; // Color for the landmark points (optional)
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw a circle for each landmark
      ctx.fill(); // Fill the circle
    });
  };
  
  const drawBoundingBox = (landmarksArray) => {
    const canvas = canvasRef2.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    landmarksArray.forEach(landmarks => {
        // Draw landmarks (circles)
        // landmarks.forEach(landmark => {
        //     const x = landmark.x * canvas.width;
        //     const y = landmark.y * canvas.height;

        //     ctx.beginPath();
        //     ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle for each landmark
        //     ctx.fill();
        // });

        // Calculate the bounding box for the hand
        const xs = landmarks.map(landmark => landmark.x * canvas.width);
        const ys = landmarks.map(landmark => landmark.y * canvas.height);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
// Optional: Add padding to the bounding box to make it less tight
        const padding = 10;  // Adjust padding as needed
        const adjustedMinX = minX - padding;
        const adjustedMaxX = maxX + padding;
        const adjustedMinY = minY - padding;
        const adjustedMaxY = maxY + padding;

        // Ensure the bounding box is within canvas boundaries
        const width = Math.max(0, adjustedMaxX - adjustedMinX);
        const height = Math.max(0, adjustedMaxY - adjustedMinY);

        // Draw a red box around the hand with optional padding
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(adjustedMinX, adjustedMinY, width, height); // Bounding box with padding
        ctx.stroke();
    });
};



  // // Crop hand based on landmarks
  // const cropHandFromLandmarks = (landmarksArray) => {
  //   const canvas = croppedCanvasRef.current; // The cropped canvas
  //   const ctx = canvas.getContext('2d');
    
  //   // Assume landmarksArray[0] contains the hand landmarks for the first hand
  //   const handLandmarks = landmarksArray[0];
  //   if (!handLandmarks) return;

  //   // Get the bounding box of the hand (min and max coordinates for x and y)
  //   const xCoords = handLandmarks.map((point) => point.x);
  //   const yCoords = handLandmarks.map((point) => point.y);

  //   // Find the min and max values for x and y coordinates
  //   const minX = Math.min(...xCoords) * videoRef.current.videoWidth;
  //   const maxX = Math.max(...xCoords) * videoRef.current.videoWidth;
  //   const minY = Math.min(...yCoords) * videoRef.current.videoHeight;
  //   const maxY = Math.max(...yCoords) * videoRef.current.videoHeight;

  //   // Ensure the bounding box fits tightly around the hand
  //   const handWidth = maxX - minX;
  //   const handHeight = maxY - minY;

  //   // Add a small margin to prevent cutting off the hand
  //   const margin = 15; // Optional, depending on your preference

  //   // Correct the dimensions to ensure the cropped canvas doesn't have extra space
  //   const cropMinX = Math.max(minX - margin, 0); // Avoid going out of bounds
  //   const cropMinY = Math.max(minY - margin, 0); // Avoid going out of bounds
  //   const cropWidth = Math.min(handWidth + 2 * margin, videoRef.current.videoWidth - cropMinX); // Ensure it's within bounds
  //   const cropHeight = Math.min(handHeight + 2 * margin, videoRef.current.videoHeight - cropMinY); // Ensure it's within bounds

  //   // Crop the hand region from the video feed and draw it on the cropped canvas
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   ctx.drawImage(videoRef.current, cropMinX, cropMinY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  // };

  const detectHands = useCallback(async (handLandmarker) => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.readyState >= 2) {
      const detections = handLandmarker.detectForVideo(videoElement, performance.now());
      setHandPresence(detections.handednesses.length > 0);

      if (detections.landmarks) {
        drawLandmarks(detections.landmarks);
        drawBoundingBox(detections.landmarks);
        // cropHandFromLandmarks(detections.landmarks); // Crop hand based on landmarks

        //switchModelBasedOnGesture(detections.landmarks[0]);
      }
    }
    requestAnimationFrame(() => detectHands(handLandmarker));
  }, []);

  useEffect(() => {
    loadModels();
    startWebcam();
  }, [loadModels, startWebcam]);

  useEffect(() => {
    const setupHandDetection = async () => {
      const handLandmarker = await initializeHandDetection();
      if (handLandmarker) {
        detectHands(handLandmarker);
      }
    };
    setupHandDetection();
  }, [initializeHandDetection, detectHands]);

  // Interval-based prediction logic for multiple models, using the cropped hand canvas
  useEffect(() => {
    let interval;
    if (isPredicting) {
      interval = setInterval(async () => {
        if (models.length > 0 && canvasRef.current) {
          const canvas = canvasRef.current; // Use cropped hand canvas for prediction
          const context = canvas.getContext('2d');
          

          // Send the cropped hand canvas to the current model for prediction
          const predictions = await models[currentModelIndex].model.predict(canvas);
          const highestPrediction = predictions.reduce((max, curr) => (curr.probability > max.probability ? curr : max), predictions[0]);
          setHighestPrediction(highestPrediction);

          const newPrediction = highestPrediction.className;
          if (newPrediction !== previousPredictionRef.current && highestPrediction.probability > 0.8) {
            previousPredictionRef.current = newPrediction;
          }
        }
      }, 100); // Set interval for predictions

      return () => clearInterval(interval); // Cleanup interval when stopped
    }

    return () => clearInterval(interval); // Cleanup on unmount
  }, [models, currentModelIndex, isPredicting]);

  const addPredictionToSentence = () => {
    if (previousPredictionRef.current) {
      setSentence((prevSentence) => prevSentence + previousPredictionRef.current);
    }
  };

  const addSpace = () => {
    setSentence((prevSentence) => prevSentence + ' ');
  };

  const removeLastCharacter = () => {
    setSentence((prevSentence) => prevSentence.slice(0, -1));
  };

  const startPrediction = () => {
    setIsPredicting(true);
  };

  const stopPrediction = () => {
    setIsPredicting(false);
  };

  const switchModel = (modelIndex) => {
    setCurrentModelIndex(modelIndex); // Set the current model index to the selected model
  };
  
  return (
    <div>
      <div className='title-box'>
      <h1 className='title'>SIGN LANGUAGE TRANSLATOR</h1>
      </div>
    <div className="app-container">
      {/* The large card container */}
      <div className="card">
        {/* Left side for video feed */}
        <div className="video-wrapper">
        <h1>{handPresence ? "The sign you are making: " + (highestPrediction ? highestPrediction.className : "No prediction") : "Try making a sign"}</h1>
        <div style={{ position: "relative" }}>
            <video ref={videoRef} autoPlay playsInline></video>
            <canvas
                    ref={canvasRef2}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none", // To allow interaction with the video underneath
                        width: "600px",
                        height: "400px",
                    }}
                ></canvas>
            <canvas ref={canvasRef} style={{ backgroundColor: "black", width: "600px", height: "480px", display: 'none',
}}></canvas>
          </div>
        </div>
  
        {/* Right side for predictions and controls */}
        <div className="prediction-wrapper">
          {loading ? (
            <div>Loading models...</div>
          ) : (
            <>
              {highestPrediction && (
                <div className="prediction-container">
                  <h3 className="prediction-title">Highest Prediction:</h3>
                  <p className="prediction-text">
                    {highestPrediction.className}: {Math.round(highestPrediction.probability * 100)}% from {models[currentModelIndex].name}
                  </p>
                </div>
              )}
  
              <div className="sentence-container">
                <h3 className="sentence-text">Sentence:</h3>
                <p className="sentence-text">{sentence}</p>
              </div>
  
              <div className="buttons-container">
                <button className="space-button" onClick={addPredictionToSentence}>Add Letter</button>
                <button className="space-button" onClick={addSpace}>Add Space</button>
                <button className="space-button" onClick={removeLastCharacter}>Backspace</button>
              </div>
  
              <div className="prediction-control-container">
                <button className="start-button" onClick={startPrediction}>Start Prediction</button>
                <button className="stop-button" onClick={stopPrediction}>Stop Prediction</button>
              </div>
  
              <div className="model-switch-container">
                <button className="switch-button" onClick={() => switchModel(0)}>A to F</button>
                <button className="switch-button" onClick={() => switchModel(1)}>G to L</button>
                <button className="switch-button" onClick={() => switchModel(2)}>M to R</button>
                <button className="switch-button" onClick={() => switchModel(3)}>S to Z</button>
              </div>
              <div className="model-switch-container-2">
              <button className="switch-button" onClick={() => switchModel(4)}>0 to 5</button>
              <button className="switch-button" onClick={() => switchModel(5)}>6 to 9</button>
              </div>
              <button
        onClick={navigateToTranslator}
        style={{ padding: '10px', fontSize: '16px' }}
      >
        Text to Sign Translator
      </button>
            </>
          )}
        </div>
          {/* <canvas ref={croppedCanvasRef} style={{ backgroundColor: "black", width: "200px", height: "200px" }}></canvas> */}
      </div>
    </div>
  </div>
  );  
};

export default WebcamPrediction;
