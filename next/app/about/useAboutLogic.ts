"use client";
import { useState, useRef, useEffect } from "react";
import { initializeLocalStorageSettings } from "@/utils/localStorage";

export const useAboutLogic = () => {
  /**
   * LocalStorageから設定値を取得
   * @returns {void}
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 初回アクセス時にlocalStorageの初期化を行う
    initializeLocalStorageSettings();
    function collectLocalStorage() {
      const result: { [key: string]: string | null } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        result[key] = localStorage.getItem(key);
      }
      return result;
    }
    const localStorageData = collectLocalStorage();
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'visit about page',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });
  }, []);

  return {};
};