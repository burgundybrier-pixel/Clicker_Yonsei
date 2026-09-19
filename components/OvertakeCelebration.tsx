"use client";

import type { CSSProperties } from "react";

export interface OvertakeEvent {
  id: number;
  names: string[];
}

export default function OvertakeCelebration({ event }: { event: OvertakeEvent | null }) {
  return (
    <div className="overtake-layer" role="status" aria-live="polite" aria-atomic="true">
      {event && (
        <div key={event.id} className="overtake-celebration">
          <div className="overtake-flames" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => (
              <span
                key={index}
                className="overtake-flame"
                style={{
                  "--x": `${(index / 15) * 100}%`,
                  "--delay": `${(index % 5) * 0.09}s`,
                  "--height": `${70 + (index % 4) * 24}px`,
                  "--drift": `${(index % 2 ? 1 : -1) * (15 + index * 2)}px`,
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="overtake-message">
            <span className="text-3xl" aria-hidden="true">🔥</span>
            <p className="mt-2 text-xs font-bold tracking-widest text-orange-300">역전 성공!</p>
            <p className="mt-2 break-keep text-lg font-extrabold text-white">
              <span className="text-amber-200">{event.names.join(", ")}</span>를 역전했습니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
