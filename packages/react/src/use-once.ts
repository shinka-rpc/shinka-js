/// <reference types="node" />

import React, { useRef, useEffect } from "react";

/**
Simple wrapper over useEffect guarantee that useEffect and its returned cleanup
callback would be called exactly once
*/
export const useOnce =
  process.env.NODE_ENV === "development"
    ? (effect: React.EffectCallback) => {
        const effectCalledRef = useRef(false);
        const doubleCleanupRef = useRef(1);
        const cleanupCbRef =
          useRef<ReturnType<React.EffectCallback>>(undefined);

        useEffect(() => {
          if (effectCalledRef.current) return cleanupCbRef.current;
          const originalCleanup = effect();
          effectCalledRef.current = true;
          if (!originalCleanup) return;
          cleanupCbRef.current = () => {
            if (doubleCleanupRef.current-- > 0) return;
            originalCleanup();
          };
          return cleanupCbRef.current;
        }, []);
      }
    : (effect: React.EffectCallback) => useEffect(effect, []);
