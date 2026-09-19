"use client";

import { useEffect, useRef, useState } from "react";

/**
 * +1 / -1 버튼의 공통 구현. SupportButton(응원, 파랑)과 AttackButton(공격, 빨강)은
 * 이 컴포넌트에 variant 만 다르게 넘기는 얇은 껍데기다.
 * 점수 요청과 별개로 클릭마다 짧은 눌림/플로팅 효과를 표시한다.
 */
export interface ScoreButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

interface Props extends ScoreButtonProps {
  variant: "support" | "attack";
  label: string;
}

const VARIANT_CLASS: Record<Props["variant"], string> = {
  support:
    "rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-900/30 hover:bg-brand-400",
  attack:
    "rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20",
};

export default function ScoreButton({ variant, onClick, disabled, label, className = "" }: Props) {
  const [effects, setEffects] = useState<number[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const pressAnimation = useRef<Animation | null>(null);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
      pressAnimation.current?.cancel();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={(event) => {
        const id = ++sequence.current;
        setEffects((prev) => [...prev, id]);
        const timer = setTimeout(() => {
          setEffects((prev) => prev.filter((effect) => effect !== id));
          timers.current.delete(timer);
        }, 650);
        timers.current.add(timer);
        pressAnimation.current?.cancel();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          pressAnimation.current = event.currentTarget.animate(
            [{ transform: "scale(.92)" }, { transform: "scale(1)" }],
            { duration: 130, easing: "ease-out" }
          );
        }
        onClick();
      }}
      disabled={disabled}
      className={`relative min-h-11 min-w-11 select-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {label}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {effects.map((id) => (
          <span key={id} className={`battle-click-float absolute left-1/2 top-0 text-base font-extrabold ${variant === "support" ? "text-brand-200" : "text-red-300"}`}
            style={{ marginLeft: `${((id % 3) - 1) * 7}px` }}>
            {variant === "support" ? "+1" : "-1"}
          </span>
        ))}
      </span>
    </button>
  );
}
