import React, { useEffect, useRef, useState } from "react";

interface ColorWheelPickerProps {
  value: string; // Hex, rgba, or gradient string
  onChange: (colorOrGradient: string) => void;
}

export function ColorWheelPicker({ value, onChange }: ColorWheelPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"solid" | "linear" | "radial">(() => {
    if (value.includes("linear-gradient")) return "linear";
    if (value.includes("radial-gradient")) return "radial";
    return "solid";
  });

  const [colorHex, setColorHex] = useState("#a7f0d4");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [stops, setStops] = useState<Array<{ color: string; pos: number }>>([
    { color: "#1b1728", pos: 0 },
    { color: "#342a56", pos: 54 },
    { color: "#193b3c", pos: 100 },
  ]);

  // Draw HSL Color Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = -radius; y < radius; y++) {
      for (let x = -radius; x < radius; x++) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance <= radius) {
          const angle = Math.atan2(y, x);
          let hue = (angle * 180) / Math.PI;
          if (hue < 0) hue += 360;

          const saturation = distance / radius;
          const lightness = 0.5;

          // HSL to RGB conversion
          const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
          const xVal = c * (1 - Math.abs(((hue / 60) % 2) - 1));
          const m = lightness - c / 2;

          let r = 0, g = 0, b = 0;
          if (hue >= 0 && hue < 60) { r = c; g = xVal; b = 0; }
          else if (hue >= 60 && hue < 120) { r = xVal; g = c; b = 0; }
          else if (hue >= 120 && hue < 180) { r = 0; g = c; b = xVal; }
          else if (hue >= 180 && hue < 240) { r = 0; g = xVal; b = c; }
          else if (hue >= 240 && hue < 300) { r = xVal; g = 0; b = c; }
          else if (hue >= 300 && hue < 360) { r = c; g = 0; b = xVal; }

          const px = (y + radius) * width + (x + radius);
          data[px * 4] = Math.round((r + m) * 255);
          data[px * 4 + 1] = Math.round((g + m) * 255);
          data[px * 4 + 2] = Math.round((b + m) * 255);
          data[px * 4 + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;
    const distance = Math.sqrt(x * x + y * y);
    const radius = canvas.width / 2;

    if (distance <= radius) {
      const angle = Math.atan2(y, x);
      let hue = (angle * 180) / Math.PI;
      if (hue < 0) hue += 360;
      const sat = Math.min(100, Math.round((distance / radius) * 100));

      const hex = hslToHex(hue, sat, 50);
      setColorHex(hex);
      if (activeTab === "solid") {
        onChange(hex);
      }
    }
  };

  function hslToHex(h: number, s: number, l: number) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const applyGradient = (updatedStops = stops, angle = gradientAngle, type = activeTab) => {
    if (type === "solid") {
      onChange(colorHex);
      return;
    }
    const stopString = updatedStops.map((s) => `${s.color} ${s.pos}%`).join(", ");
    if (type === "linear") {
      onChange(`linear-gradient(${angle}deg, ${stopString})`);
    } else {
      onChange(`radial-gradient(circle at center, ${stopString})`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.06)", padding: "2px", borderRadius: "6px" }}>
        {(["solid", "linear", "radial"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            style={{
              flex: 1,
              padding: "4px",
              fontSize: "10px",
              borderRadius: "4px",
              border: "none",
              background: activeTab === tab ? "#a7f0d4" : "transparent",
              color: activeTab === tab ? "#151218" : "#d6d1df",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => {
              setActiveTab(tab);
              applyGradient(stops, gradientAngle, tab);
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          width={110}
          height={110}
          style={{ borderRadius: "50%", cursor: "crosshair", border: "2px solid rgba(255,255,255,0.2)" }}
          onClick={handleCanvasClick}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: colorHex, border: "1px solid #fff" }} />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => {
                setColorHex(e.target.value);
                if (activeTab === "solid") onChange(e.target.value);
              }}
              style={{ width: "65px", background: "#1a1622", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "10px", padding: "2px 4px", borderRadius: "4px" }}
            />
          </div>
          {activeTab !== "solid" && (
            <label style={{ fontSize: "9px", color: "#a9a2b2", display: "flex", flexDirection: "column", gap: "2px" }}>
              Angle ({gradientAngle}°)
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => {
                  const deg = Number(e.target.value);
                  setGradientAngle(deg);
                  applyGradient(stops, deg, activeTab);
                }}
                style={{ width: "100%", accentColor: "#a7f0d4" }}
              />
            </label>
          )}
        </div>
      </div>

      {activeTab !== "solid" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "9px", color: "#a9a2b2", fontWeight: 600 }}>Gradient Color Stops</span>
          {stops.map((stop, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="color"
                value={stop.color.startsWith("#") ? stop.color : "#342a56"}
                onChange={(e) => {
                  const next = [...stops];
                  next[idx] = { ...next[idx]!, color: e.target.value };
                  setStops(next);
                  applyGradient(next, gradientAngle, activeTab);
                }}
                style={{ width: "20px", height: "20px", border: "none", padding: 0, background: "none", cursor: "pointer" }}
              />
              <input
                type="text"
                value={stop.color}
                onChange={(e) => {
                  const next = [...stops];
                  next[idx] = { ...next[idx]!, color: e.target.value };
                  setStops(next);
                  applyGradient(next, gradientAngle, activeTab);
                }}
                style={{ width: "55px", background: "#1a1622", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "9px", padding: "2px 4px", borderRadius: "4px" }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={stop.pos}
                onChange={(e) => {
                  const next = [...stops];
                  next[idx] = { ...next[idx]!, pos: Number(e.target.value) };
                  setStops(next);
                  applyGradient(next, gradientAngle, activeTab);
                }}
                style={{ flex: 1, accentColor: "#a7f0d4" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
