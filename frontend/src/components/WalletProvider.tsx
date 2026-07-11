"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { connectWallet } from "@/lib/genlayer";

type WalletContextValue = {
  address: string;
  busy: boolean;
  error: string;
  connect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setBusy(true);
    setError("");
    const result = await connectWallet();
    if (result.success && typeof result.data === "string") setAddress(result.data);
    else setError(result.error || "Wallet connection failed");
    setBusy(false);
  }

  const value = useMemo(() => ({ address, busy, error, connect }), [address, busy, error]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
