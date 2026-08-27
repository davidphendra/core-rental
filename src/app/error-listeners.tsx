"use client";

import { useEffect } from "react";

import { initGlobalErrorListeners } from "./global-error-handler";

export function ErrorListeners() {
  useEffect(() => {
    initGlobalErrorListeners();
  }, []);

  return null;
}
