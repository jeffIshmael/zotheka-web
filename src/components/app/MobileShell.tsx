"use client";

import { ReactNode } from "react";

const MOBILE_WIDTH = 430;

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#2b2b2b]">
      <div
        className="relative mx-auto min-h-screen w-full bg-background shadow-[0_0_80px_rgba(0,0,0,0.45)]"
        style={{ maxWidth: MOBILE_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}

export const MOBILE_MAX_WIDTH = MOBILE_WIDTH;
