/// <reference types="node" />

import React, { useRef, useEffect } from "react";

/**
 * Runs the effect only once per hook instance and ensures that its cleanup
 * is also executed only once, including under React Strict Mode
 */
export const useOnce =
  process.env.NODE_ENV === "development"
    ? (effect: React.EffectCallback) => {
        const effectCalledRef = useRef(false);
        const strictModeCleanupRef = useRef(1);
        const cleanupCbRef =
          useRef<ReturnType<React.EffectCallback>>(undefined);

        useEffect(() => {
          if (effectCalledRef.current) return cleanupCbRef.current;
          const originalCleanup = effect();
          effectCalledRef.current = true;
          if (!originalCleanup) return;
          cleanupCbRef.current = () => {
            if (strictModeCleanupRef.current-- > 0) return;
            originalCleanup();
          };
          return cleanupCbRef.current;
        }, []);
      }
    : (effect: React.EffectCallback) => useEffect(effect, []);
