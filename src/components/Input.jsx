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
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when text updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentText]);

  useEffect(() => {
    if (!dataReady || !response) return;

    // Check if we've finished the transcript and should show justification
    if (response.transcript && currentIndex >= response.transcript.length) {
      if (response.judge?.justification && !showingJustification) {
        setShowingJustification(true);
        setAvatar(0); // Set to judge avatar
        
        let i = 0;
        setCurrentText(""); // reset text
        const justification = response.judge.justification;

        const interval = setInterval(() => {
          setCurrentText((prev) => prev + justification[i]);
          i++;
          if (i >= justification.length) {
            clearInterval(interval);
            // Final case is complete - no more transitions
          }
        }, 40);

        return () => clearInterval(interval);
      }
      return; // Don't proceed with transcript logic if we're past it
    }

    // Regular transcript logic
    if (!response?.transcript) return;

    const transcript = response.transcript;
    if (currentIndex >= transcript.length) return;

    const currentItem = transcript[currentIndex];
    if (!currentItem?.agent || !currentItem?.content) return;

    const agent = currentItem.agent;
    const content = currentItem.content;

    // Only set avatar if agent exists
    const avatarIndex =
      agent === "judge" ? 0 : agent === "defense" ? 2 : 1;
    setAvatar(avatarIndex);

    let i = 0;
    setCurrentText(""); // reset text

    const interval = setInterval(() => {
      setCurrentText((prev) => prev + content[i]);
      i++;
      if (i >= content.length) {
        clearInterval(interval);
        setTimeout(() => {
          // Only increment if we haven't reached the end
          if (currentIndex + 1 < transcript.length) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            // We've reached the end of transcript, trigger justification
            setCurrentIndex((prev) => prev + 1);
          }
        }, 2000);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, dataReady, response, setAvatar, showingJustification]);

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
      <div 
        ref={scrollRef}
        className="bg-white bg-opacity-80 rounded-lg max-w-3xl w-full p-4 max-h-64 overflow-auto scroll-smooth"
      >
        {currentText && (
          <div>
            <p>
              <strong>
                {showingJustification ? "JUDGE (FINAL VERDICT)" : currentAgent.toUpperCase()}:
              </strong> 
              <span className="ml-2">
                <ReactMarkdown>{currentText}</ReactMarkdown>
              </span>
            </p>
            {showingJustification && (
              <div className="mt-4 text-sm text-stone-950 italic">
                Case concluded.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;