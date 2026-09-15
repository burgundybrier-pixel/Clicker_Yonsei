"use client";

interface SupportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function SupportButton({
  onClick,
  disabled,
  label = "응원하기 +1",
  className = "",
}: SupportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`select-none rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-900/30 transition hover:bg-brand-400 active:scale-95 active:animate-pop disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}
