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

  // Start typing animation for current item
  const startTyping = (content, isJustificationText = false) => {
    if (!content || typeof content !== 'string') return;
    
    clearTyping(); // Clear any existing animation
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

  // Handle next button click
  const handleNext = () => {
    setShowNextButton(false);
    clearTyping(); // Clear any existing typing

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
        <div 
          ref={scrollRef}
          className="bg-white bg-opacity-90 rounded-lg w-full p-4 max-h-64 overflow-y-auto mb-4 shadow-lg"
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