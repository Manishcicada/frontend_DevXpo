import React, { useState, useEffect, useRef } from "react";
import useStore from "../store/useStore";
import ReactMarkdown from 'react-markdown'

const Input = () => {
  const dataReady = useStore((state) => state.dataReady);
  const response = useStore((state) => state.response);
  const setAvatar = useStore((state) => state.setAvatar);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showingJustification, setShowingJustification] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const scrollRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Auto-scroll to bottom when text updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentText]);

  // Clear any existing typing animation
  const clearTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Stop any ongoing speech
  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Speak text with different voice settings for each agent
  const speakText = (text, agent) => {
    if (!('speechSynthesis' in window) || !text) return;
    
    stopSpeech(); // Stop any ongoing speech
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    // Different voice settings for each agent
    switch(agent.toLowerCase()) {
      case 'judge':
        utterance.voice = voices.find(v => v.name.includes('Male') && v.lang.includes('en')) || voices[0];
        utterance.pitch = 0.8;
        utterance.rate = 0.85;
        utterance.volume = 0.9;
        break;
      case 'defense':
        utterance.voice = voices.find(v => v.name.includes('Female') && v.lang.includes('en')) || voices[1];
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
        utterance.volume = 0.9;
        break;
      case 'opposition':
        utterance.voice = voices.find(v => v.name.includes('Male') && v.lang.includes('en')) || voices[2];
        utterance.pitch = 0.9;
        utterance.rate = 1.05;
        utterance.volume = 0.9;
        break;
      default:
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.volume = 0.9;
    }
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  // Toggle auto-play functionality
  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
    if (!autoPlay && currentText && !isPlaying) {
      // Start playing current text if turning on auto-play
      speakText(currentText, currentAgent);
    } else if (autoPlay && isPlaying) {
      // Stop playing if turning off auto-play
      stopSpeech();
    }
  };

  // Start typing animation for current item
  const startTyping = (content, isJustificationText = false) => {
    if (!content || typeof content !== 'string') return;
    
    clearTyping(); // Clear any existing animation
    stopSpeech(); // Stop any ongoing speech
    setIsTyping(true);
    setCurrentText("");
    
    let i = 0;
    const chars = content.split(''); // Split into individual characters

    typingIntervalRef.current = setInterval(() => {
      if (i < chars.length) {
        setCurrentText((prev) => prev + chars[i]);
        i++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        
        // Auto-play voice if enabled
        if (autoPlay) {
          const agent = isJustificationText ? 'judge' : currentAgent;
          speakText(content, agent);
        }
        
        // Show next button only if there's more content or we haven't shown justification yet
        if (!isJustificationText && (currentIndex + 1 < response?.transcript?.length || response?.judge?.justification)) {
          setShowNextButton(true);
        } else if (isJustificationText) {
          // Final case - no next button needed
          setShowNextButton(false);
        }
      }
    }, isJustificationText ? 40 : 50);
  };

  // Skip typing animation and show full content
  const skipTyping = () => {
    clearTyping();
    stopSpeech();
    setIsTyping(false);
    
    // Set full content based on current state
    if (showingJustification && response?.judge?.justification) {
      setCurrentText(response.judge.justification);
      if (autoPlay) {
        speakText(response.judge.justification, 'judge');
      }
    } else if (response?.transcript?.[currentIndex]?.content) {
      const content = response.transcript[currentIndex].content;
      setCurrentText(content);
      if (autoPlay) {
        speakText(content, currentAgent);
      }
    }
    
    // Show next button if there's more content
    if (showingJustification) {
      setShowNextButton(false);
    } else if (currentIndex + 1 < response?.transcript?.length || response?.judge?.justification) {
      setShowNextButton(true);
    }
  };

  // Handle next button click
  const handleNext = () => {
    setShowNextButton(false);
    clearTyping(); // Clear any existing typing
    stopSpeech(); // Stop any ongoing speech

    // Check if we should show justification
    if (currentIndex + 1 >= response?.transcript?.length && response?.judge?.justification && !showingJustification) {
      setShowingJustification(true);
      setAvatar(0); // Set to judge avatar
      startTyping(response.judge.justification, true);
      return;
    }

    // Move to next transcript item
    if (currentIndex + 1 < response?.transcript?.length) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Effect to handle initial setup and index changes
  useEffect(() => {
    if (!dataReady || !response?.transcript?.length) return;
    
    if (showingJustification) return;

    const currentItem = response.transcript[currentIndex];
    if (!currentItem?.agent || !currentItem?.content) return;

    const agent = currentItem.agent;
    const content = currentItem.content;

    // Set avatar
    const avatarIndex = agent === "judge" ? 0 : agent === "defense" ? 2 : 1;
    setAvatar(avatarIndex);

    // Start typing animation
    if (!hasStarted || currentIndex > 0) {
      setHasStarted(true);
      startTyping(content);
    }
  }, [currentIndex, dataReady, response, setAvatar, showingJustification, hasStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTyping();
      stopSpeech();
    };
  }, []);

  if (!dataReady) {
    return (
      <div className="fixed bottom-16 left-0 flex flex-col w-full p-4 text-xl z-50 bg-white">
        Reading your case...
      </div>
    );
  }

  // Determine current agent for display
  let currentAgent = "judge";
  
  if (showingJustification) {
    currentAgent = "judge";
  } else if (response?.transcript?.[currentIndex]) {
    currentAgent = response.transcript[currentIndex].agent;
  }

  return (
    <div className="fixed bottom-4 left-0 w-full flex justify-center p-4 z-50">
      <div className="max-w-3xl w-full">
        {/* Voice Controls */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <button
              onClick={toggleAutoPlay}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                autoPlay 
                  ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-400'
              }`}
            >
              🔊 Auto-play {autoPlay ? 'ON' : 'OFF'}
            </button>
            
            {!autoPlay && currentText && (
              <button
                onClick={() => speakText(currentText, currentAgent)}
                disabled={isPlaying}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              >
                {isPlaying ? '🔊 Playing...' : '🔊 Play'}
              </button>
            )}
            
            {isPlaying && (
              <button
                onClick={stopSpeech}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="bg-white bg-opacity-90 rounded-lg w-full p-4 max-h-64 overflow-y-auto mb-4 shadow-lg relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          {currentText && (
            <div>
              <p>
                <strong className="text-gray-800">
                  {showingJustification ? "JUDGE (FINAL VERDICT)" : currentAgent?.toUpperCase()}:
                </strong> 
                <span className="ml-2">
                  <ReactMarkdown>{currentText}</ReactMarkdown>
                </span>
              </p>
              {showingJustification && (
                <div className="mt-4 text-sm text-gray-600 italic">
                  Case concluded.
                </div>
              )}
            </div>
          )}
          
          {/* Skip Button - only show during typing */}
          {isTyping && (
            <div className="absolute bottom-2 right-2">
              <button
                onClick={skipTyping}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 shadow-sm"
              >
                Skip
              </button>
            </div>
          )}
        </div>
        
        {/* Next Button */}
        {showNextButton && !isTyping && (
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
            >
              {currentIndex + 1 >= (response?.transcript?.length || 0) ? "Show Verdict" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;