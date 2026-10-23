// src/components/DynamicQrCode.tsx
"use client";

import React, { useMemo } from "react";

export interface DynamicQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Computes a deterministic 21x21 QR matrix with standard corner finder
 * patterns and pseudorandom data modules derived from the string value.
 */
function generateQrMatrix(input: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Helper to draw a square finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isOuterBorder || isCenter;
      }
    }
  };

  // 1. Finder patterns at (0,0), (14,0), (0,14)
  drawFinder(0, 0);
  drawFinder(14, 0);
  drawFinder(0, 14);

  // 2. Timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Simple hash of input to fill data modules deterministically
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  let seed = Math.abs(hash) || 1234567;
  const nextRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Populate data area avoiding finder patterns & timing patterns
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFinderTL = r < 8 && c < 8;
      const isFinderTR = r < 8 && c >= 13;
      const isFinderBL = r >= 13 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!isFinderTL && !isFinderTR && !isFinderBL && !isTiming) {
        matrix[r][c] = nextRandom() > 0.45;
      }
    }
  }

  return matrix;
}

export default function DynamicQrCode({
  value,
  size = 180,
  className = "",
  darkColor = "#0f172a",
  lightColor = "#ffffff",
}: DynamicQrCodeProps) {
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const moduleCount = 21;
  const cellSize = size / moduleCount;

  return (
    <div
      className={`inline-block p-2 rounded-xl bg-white shadow-md border border-gray-200 ${className}`}
      style={{ width: size + 16, height: size + 16 }}
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block select-none"
      >
        <rect width={size} height={size} fill={lightColor} />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={darkColor}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
