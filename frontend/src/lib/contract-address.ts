"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "neighborpeace.contract-address";
const CHANGE_EVENT = "neighborpeace:contract-address";
const ENV_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export function isContractAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function resolveContractAddress(explicit?: string) {
  if (explicit) return explicit;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY) || "";
    if (isContractAddress(stored)) return stored;
  }
  return ENV_ADDRESS;
}

export function saveContractAddress(value: string) {
  const normalized = value.trim();
  if (!isContractAddress(normalized)) throw new Error("Enter a valid 0x contract address.");
  window.localStorage.setItem(STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: normalized }));
  return normalized;
}

export function resetContractAddress() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: ENV_ADDRESS }));
}

export function useContractAddress() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(CHANGE_EVENT, onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        window.removeEventListener(CHANGE_EVENT, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => resolveContractAddress(),
    () => ENV_ADDRESS,
  );
}
