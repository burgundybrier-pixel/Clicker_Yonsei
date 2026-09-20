"use client";

import ScoreButton, { type ScoreButtonProps } from "./ScoreButton";

/** 상대 학과 공격(-1) 버튼. 실제 구현은 ScoreButton.tsx. */
export default function AttackButton({ label = "공격 -1", ...rest }: ScoreButtonProps) {
  return <ScoreButton variant="attack" label={label} {...rest} />;
}
