"use client";

/**
 * +1 / -1 버튼의 공통 구현. SupportButton(응원, 파랑)과 AttackButton(공격, 빨강)은
 * 이 컴포넌트에 variant 만 다르게 넘기는 얇은 껍데기다.
 * 눌렀을 때 살짝 튀는 애니메이션(active:animate-pop)은 tailwind.config.ts 의 keyframes 에 정의돼 있다.
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`select-none transition active:scale-95 active:animate-pop disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {label}
    </button>
  );
}
