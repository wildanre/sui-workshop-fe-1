import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";

export function TransferForm() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxDigest(null);

    // Validation
    if (!recipient.startsWith("0x")) {
      setError("Invalid recipient address");
      return;
    }

    const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);

    if (isNaN(amountInMist) || amountInMist <= 0) {
      setError("Invalid amount");
      return;
    }

    // Build transaction
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
    tx.transferObjects([coin], recipient);

    // Execute
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: ({ digest, effects }) => {
          setTxDigest(digest);
          setRecipient("");
          setAmount("");
        },
        onError: (err) => {
          setError(err.message || "Transaction failed");
        },
      }
    );
  };

  if (!account) {
    return <div>Please connect your wallet to transfer SUI</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="transfer-form">
      <h2>Transfer SUI</h2>

      <div className="form-group">
        <label htmlFor="recipient">Recipient Address</label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount (SUI)</label>
        <input
          id="amount"
          type="number"
          step="0.00000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          required
        />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send SUI"}
      </button>

      {error && <div className="alert alert-error">❌ {error}</div>}

      {txDigest && (
        <div className="alert alert-success">
          ✅ Transaction successful!
          <br />
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </form>
  );
}
