"use client";

import { useEffect, useState } from "react";
import "@/app/terminal-animation.css";

export default function Loading() {
  const [text, setText] = useState("");
  const fullText = "gaurav";
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.substring(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="terminal-loading-container">
      <div className="terminal-window">
        {/* Terminal header with dots */}
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="terminal-content">
          <span className="terminal-prompt">&gt;</span>
          <span className="terminal-text">{text}</span>
          <span className={`terminal-cursor ${showCursor ? "visible" : ""}`}>
            _
          </span>
        </div>

        {/* Loading subtitle */}
        <div className="terminal-subtitle">Initializing portfolio...</div>
      </div>
    </div>
  );
}
