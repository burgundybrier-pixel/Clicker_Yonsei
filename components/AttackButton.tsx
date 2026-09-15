"use client";

interface AttackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function AttackButton({
  onClick,
  disabled,
  label = "공격 -1",
  className = "",
}: AttackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`select-none rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95 active:animate-pop disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}
