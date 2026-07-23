"use client";

import { useEffect, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";

type Props = {
  visible: boolean;
  walletAddress: string | undefined;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
};

const USDC_CONTRACT = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

// Simple ERC20 transfer encoder
function encodeErc20Transfer(to: string, amount: bigint): string {
  const cleanAddress = to.startsWith("0x") ? to.slice(2) : to;
  const paddedAddress = cleanAddress.padStart(64, "0");
  const hexAmount = amount.toString(16).padStart(64, "0");
  return `0xa9059cbb${paddedAddress}${hexAmount}`;
}

export function SendUsdcModal({ visible, walletAddress, balance, onClose, onSuccess }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { sendTransaction } = useSendTransaction();

  useEffect(() => {
    if (!visible) {
      setRecipient("");
      setAmountStr("");
      setError(null);
      setTxHash(null);
      setLoading(false);
    }
  }, [visible]);

  const handleMax = () => {
    setAmountStr(balance.toString());
  };

  const handleSend = async () => {
    const amount = Number(amountStr);
    if (!recipient || !recipient.startsWith("0x") || recipient.length !== 42) {
      setError("Please enter a valid EVM recipient address");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 6 decimals for USDC
      const amountUnits = BigInt(Math.floor(amount * 1_000_000));
      const data = encodeErc20Transfer(recipient, amountUnits);

      const txReceipt = await sendTransaction({
        to: USDC_CONTRACT,
        data,
        value: "0x0",
        chainId: 8453
      }, {
        sponsor: true
      });

      if (txReceipt && txReceipt.hash) {
        setTxHash(txReceipt.hash);
        setTimeout(() => {
          onSuccess();
        }, 3000); // give user time to see the success message and hash
      } else {
        throw new Error("Transaction failed or was rejected");
      }
    } catch (err: any) {
      console.error("Send failed", err);
      setError(err.message || "Failed to send USDC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-extrabold">Send USDC (Base)</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-muted">Recipient Address</p>
            <div className="flex h-12 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 ring-brand-green">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                disabled={loading || !!txHash}
                className="flex-1 bg-transparent px-4 text-sm font-semibold outline-none text-brand-black disabled:opacity-50"
              />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">Amount (USDC)</p>
            <p className="text-xs font-semibold text-brand-black">
              Available: ${balance.toFixed(2)}{" "}
              <button
                type="button"
                onClick={handleMax}
                className="text-brand-green underline ml-1 hover:text-brand-green-dark"
              >
                Max
              </button>
            </p>
          </div>
          
          <div className="mb-4 flex h-16 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 ring-brand-green">
            <div className="flex items-center justify-center bg-muted/10 px-4 text-sm font-bold text-muted">
              USDC
            </div>
            <input
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              disabled={loading || !!txHash}
              className="flex-1 bg-transparent px-3 text-2xl font-black outline-none text-brand-black disabled:opacity-50"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-500 font-semibold">{error}</p>}
          
          {txHash && (
            <div className="mb-4 p-3 bg-brand-green/10 rounded-xl">
              <p className="text-sm font-bold text-brand-green">Sent Successfully! ✓</p>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-xs text-brand-green underline break-all mt-1 inline-block">
                {txHash}
              </a>
            </div>
          )}

          <button
            type="button"
            disabled={loading || !!txHash || !amountStr || !recipient}
            onClick={handleSend}
            className={`mt-2 h-[52px] w-full rounded-xl text-base font-bold transition-all ${
              (!loading && !txHash && amountStr && recipient)
                ? "bg-brand-green text-white hover:bg-brand-green-dark"
                : txHash
                ? "bg-brand-green text-white"
                : "bg-border text-brand-black/40"
            }`}
          >
            {txHash ? "Sent!" : loading ? "Sending..." : "Send"}
          </button>
          <p className="text-center text-[10px] text-muted mt-3">
            Transactions are sponsored on the Base network via CDP paymaster.
          </p>
        </div>
      </div>
    </div>
  );
}
