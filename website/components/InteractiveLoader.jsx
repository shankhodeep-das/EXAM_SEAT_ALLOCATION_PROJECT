"use client";

import React, { useState, useEffect } from "react";

export default function InteractiveLoader({ onLoadingComplete }) {
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState("Initializing Room Matrix Nodes...");
  const [activeSeat, setActiveSeat] = useState(2);

  // Simulated progression phases giving a "WOW" technical feel
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText("Mapping Student Roll Numbers to Hall Capacity...");
      setActiveSeat(5);
    }, 900);

    const timer2 = setTimeout(() => {
      setProgress(78);
      setStatusText("Optimizing Proximity & Section Constraints...");
      setActiveSeat(9);
    }, 1800);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText("Seat Allocation Complete! Launching Portal...");
      setActiveSeat(11);
    }, 2600);

    const timer4 = setTimeout(() => {
      if (onLoadingComplete) onLoadingComplete();
    }, 3100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onLoadingComplete]);

  return (
    <div className="loader-overlay">
      {/* Background Dot-Matrix Overlay matching your theme */}
      <div className="cs-dot-bg" />

      <div className="loader-card">
        
        {/* Animated Radar Pulse Icon */}
        <div className="radar-circle">
          <div className="radar-dot"></div>
        </div>

        {/* Brand Header */}
        <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", color: "#2563eb", textTransform: "uppercase", marginBottom: "4px" }}>
          SeatWise Engine v1.0
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          Synchronizing Exam Halls
        </h2>

        {/* Dynamic Status Text */}
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", minHeight: "20px" }}>
          {statusText}
        </p>

        {/* Smooth Progress Bar */}
        <div className="loader-progress-track">
          <div className="loader-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "#94a3b8" }}>
          <span>Loading Assets</span>
          <span>{progress}%</span>
        </div>

        {/* Interactive Matrix Preview Grid (The "WOW" Element) */}
        <div className="seat-matrix-preview">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
            <div
              key={num}
              className={`matrix-seat-box ${num <= activeSeat ? "allocated" : ""}`}
            >
              B{num <= 4 ? "1" : num <= 8 ? "2" : "3"}-{num < 10 ? `0${num}` : num}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "16px", fontSize: "11px", color: "#94a3b8" }}>
          Securing encrypted node channels...
        </div>

      </div>
    </div>
  );
}