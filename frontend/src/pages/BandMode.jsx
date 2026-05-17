import React, { useEffect, useState } from "react";

export default function BandMode() {
  const [status, setStatus] = useState("Monitoring...");

  useEffect(() => {

    function handleMotion(event) {
      const acc = event.accelerationIncludingGravity;

      if (!acc) return;

      const total =
        Math.abs(acc.x || 0) +
        Math.abs(acc.y || 0) +
        Math.abs(acc.z || 0);

      if (total > 40) {
        setStatus("🚨 Fall Detected!");
      }
    }

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "Arial"
      }}
    >
      <h1>Surakhsa Core Band Mode</h1>
      <h2>{status}</h2>
    </div>
  );
}