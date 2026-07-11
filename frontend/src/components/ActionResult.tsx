export function ActionResult({ state }: { state: { tone: "idle" | "busy" | "success" | "error"; message: string; hash?: string } }) {
  if (!state.message) return null;
  return (
    <div className={`notice ${state.tone === "success" ? "success" : state.tone === "error" ? "error" : ""}`} role="status">
      <strong>{state.tone === "busy" ? "Transaction in progress" : state.tone === "success" ? "Transaction finalized" : state.tone === "error" ? "Transaction failed" : "Status"}</strong>
      <div className="mt-1 text-sm break-words">{state.message}</div>
      {state.hash && <a className="underline text-sm mt-2 inline-block" target="_blank" rel="noreferrer" href={`https://explorer-studio.genlayer.com/tx/${state.hash}`}>View transaction on Explorer</a>}
    </div>
  );
}
