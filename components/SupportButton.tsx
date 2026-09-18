"use client";

import ScoreButton, { type ScoreButtonProps } from "./ScoreButton";

/** 내 학과 응원(+1) 버튼. 실제 구현은 ScoreButton.tsx. */
export default function SupportButton({ label = "응원하기 +1", ...rest }: ScoreButtonProps) {
  return <ScoreButton variant="support" label={label} {...rest} />;
}
