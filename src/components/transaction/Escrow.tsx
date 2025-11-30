"use client";

import { Transaction } from "@mysten/sui/transactions";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useCurrentAccount,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionDialog } from "@/components/ui/dialog-transaction";
import { useState, useEffect, useMemo } from "react";

const PACKAGE_ID =
  "0xfe02aaaf954b752272ea188d398e36d1d117d3641f4b90d21b2f0df3dfcf18a2";

const coinTypes = [
  { value: "0x2::sui::SUI", label: "Sui" },
  { value: `${PACKAGE_ID}::mock_coin::MOCK_COIN`, label: "Mock Coin" },
  { value: `${PACKAGE_ID}::mock_tbtc::MOCK_TBTC`, label: "Mock TBTC" },
  { value: `${PACKAGE_ID}::mock_zsui::MOCK_ZSUI`, label: "Mock zSUI" },
  { value: "custom", label: "Custom Coin Type" },
];

export default function Escrow() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Create Escrow State
  const [depositCoinId, setDepositCoinId] = useState("");
  const [depositCoinType, setDepositCoinType] = useState(
    `${PACKAGE_ID}::mock_coin::MOCK_COIN`
  );
  const [isCustomDeposit, setIsCustomDeposit] = useState(false);
  const [paymentCoinType, setPaymentCoinType] = useState(
    `${PACKAGE_ID}::mock_zsui::MOCK_ZSUI`
  );
  const [isCustomPayment, setIsCustomPayment] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("1");

  // Accept Escrow State
  const [acceptEscrowId, setAcceptEscrowId] = useState("");
  const [acceptPaymentCoinId, setAcceptPaymentCoinId] = useState("");
  const [acceptDepositType, setAcceptDepositType] = useState(
    "mock_coin::MOCK_COIN"
  );
  const [acceptPaymentType, setAcceptPaymentType] = useState(
    "mock_zsui::MOCK_ZSUI"
  );

  // Cancel Escrow State
  const [cancelEscrowId, setCancelEscrowId] = useState("");
  const [cancelDepositType, setCancelDepositType] = useState(
    "mock_coin::MOCK_COIN"
  );
  const [cancelPaymentType, setCancelPaymentType] = useState(
    "mock_zsui::MOCK_ZSUI"
  );

  // Transaction Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txDigest, setTxDigest] = useState("");
  const [txTitle, setTxTitle] = useState("");
  const [txDescription, setTxDescription] = useState("");

  // Fetch deposit coins for create escrow
  const { data: depositCoins } = useSuiClientQuery(
    "getCoins",
    {
      owner: account?.address as string,
      coinType: depositCoinType,
    },
    {
      enabled: !!account,
    }
  );

  // Fetch payment coins for accept escrow
  const { data: paymentCoins } = useSuiClientQuery(
    "getCoins",
    {
      owner: account?.address as string,
      coinType: acceptPaymentType,
    },
    {
      enabled: !!account && !!acceptPaymentType,
    }
  );

  // Fetch escrow object details for auto-detection
  const { data: escrowObject } = useSuiClientQuery(
    "getObject",
    {
      id: acceptEscrowId,
      options: {
        showType: true,
        showContent: true,
      },
    },
    {
      enabled: !!acceptEscrowId,
    }
  );

  // Fetch escrow object for Cancel tab
  const { data: cancelEscrowObject } = useSuiClientQuery(
    "getObject",
    {
      id: cancelEscrowId,
      options: {
        showType: true,
        showContent: true,
      },
    },
    {
      enabled: !!cancelEscrowId,
    }
  );

  // Auto-detect coin types from escrow object
  useEffect(() => {
    if (escrowObject?.data?.type) {
      const type = escrowObject.data.type;
      // Extract type parameters from: 0xPACKAGE::simple_escrow::Escrow<DepositType, PaymentType>
      const match = type.match(
        /Escrow<(.+)::(\w+)::(\w+),\s*(.+)::(\w+)::(\w+)>/
      );

      if (match) {
        const depositPackage = match[1];
        const depositModule = match[2];
        const depositStruct = match[3];
        const paymentPackage = match[4];
        const paymentModule = match[5];
        const paymentStruct = match[6];

        // Set the coin types
        setAcceptDepositType(
          `${depositPackage}::${depositModule}::${depositStruct}`
        );
        setAcceptPaymentType(
          `${paymentPackage}::${paymentModule}::${paymentStruct}`
        );
      }
    }
  }, [escrowObject]);

  // Auto-detect coin types for Cancel tab
  useEffect(() => {
    if (cancelEscrowObject?.data?.type) {
      const type = cancelEscrowObject.data.type;
      const match = type.match(
        /Escrow<(.+)::(\w+)::(\w+),\s*(.+)::(\w+)::(\w+)>/
      );

      if (match) {
        const depositPackage = match[1];
        const depositModule = match[2];
        const depositStruct = match[3];
        const paymentPackage = match[4];
        const paymentModule = match[5];
        const paymentStruct = match[6];

        setCancelDepositType(
          `${depositPackage}::${depositModule}::${depositStruct}`
        );
        setCancelPaymentType(
          `${paymentPackage}::${paymentModule}::${paymentStruct}`
        );
      }
    }
  }, [cancelEscrowObject]);

  const availableDepositCoins = useMemo(
    () => depositCoins?.data || [],
    [depositCoins?.data]
  );
  const availablePaymentCoins = useMemo(
    () => paymentCoins?.data || [],
    [paymentCoins?.data]
  );

  // Auto-select payment coin when payment coins are loaded
  useEffect(() => {
    if (availablePaymentCoins.length > 0 && !acceptPaymentCoinId) {
      // Auto-select the first available payment coin
      setAcceptPaymentCoinId(availablePaymentCoins[0].coinObjectId);
    }
  }, [availablePaymentCoins, acceptPaymentCoinId]);

  // Ensure deposit and payment coin types are different
  useEffect(() => {
    if (depositCoinType === paymentCoinType) {
      // Find a different coin type
      const differentCoin = coinTypes.find((c) => c.value !== depositCoinType);
      if (differentCoin) {
        setPaymentCoinType(differentCoin.value);
      }
    }
  }, [depositCoinType, paymentCoinType]);

  const handleCreate = () => {
    if (!account || !depositCoinId) return;

    const tx = new Transaction();
    const depositType = depositCoinType;
    const paymentType = paymentCoinType;

    // Convert to smallest units (multiply by 1e9)
    const requestAmountInSmallestUnit = BigInt(
      Math.floor(Number(requestedAmount) * 1_000_000_000)
    );
    const depositAmountInSmallestUnit = BigInt(
      Math.floor(Number(depositAmount) * 1_000_000_000)
    );

    const [depositCoin] = tx.splitCoins(tx.object(depositCoinId), [
      tx.pure.u64(depositAmountInSmallestUnit),
    ]);

    tx.moveCall({
      target: `${PACKAGE_ID}::simple_escrow::create_escrow`,
      typeArguments: [depositType, paymentType],
      arguments: [depositCoin, tx.pure.u64(requestAmountInSmallestUnit)],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Escrow created!", result);
          setTxDigest(result.digest);
          setTxTitle("Escrow Created Successfully!");
          setTxDescription(
            `Your escrow has been created with ${requestedAmount} ${
              paymentCoinType.split("::")[1] || "Payment Coin"
            } requested.`
          );
          setDialogOpen(true);
          client.waitForTransaction({ digest: result.digest });
          // Invalidate balance and coins queries
          queryClient.invalidateQueries({ queryKey: ["sui", "getBalance"] });
          queryClient.invalidateQueries({ queryKey: ["sui", "getCoins"] });
        },
        onError: (error) => console.error("Create failed:", error),
      }
    );
  };

  const handleAccept = () => {
    if (!account || !acceptEscrowId || !acceptPaymentCoinId) return;

    const tx = new Transaction();
    const depositType = acceptDepositType;
    const paymentType = acceptPaymentType;

    if (!escrowObject?.data?.content) return;
    const escrowContent = escrowObject.data.content;

    if (escrowContent.dataType !== "moveObject") {
      console.error("Escrow object is not a move object");
      return;
    }

    const requestedAmount = (escrowContent.fields as Record<string, unknown>)
      .requested_amount as string;

    const [paymentCoin] = tx.splitCoins(tx.object(acceptPaymentCoinId), [
      tx.pure.u64(requestedAmount),
    ]);

    tx.moveCall({
      target: `${PACKAGE_ID}::simple_escrow::accept_escrow`,
      typeArguments: [depositType, paymentType],
      arguments: [tx.object(acceptEscrowId), paymentCoin],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Escrow accepted!", result);
          setTxDigest(result.digest);
          setTxTitle("Escrow Accepted Successfully!");
          setTxDescription(
            "You have accepted the escrow. The deposit has been sent to you and the payment to the seller."
          );
          setDialogOpen(true);
          client.waitForTransaction({ digest: result.digest });
          // Invalidate balance and coins queries
          queryClient.invalidateQueries({ queryKey: ["sui", "getBalance"] });
          queryClient.invalidateQueries({ queryKey: ["sui", "getCoins"] });
          // Escrow object is deleted, so we don't need to invalidate it, but we might want to clear the form
          setAcceptEscrowId("");
        },
        onError: (error) => console.error("Accept failed:", error),
      }
    );
  };

  const handleCancel = () => {
    if (!account || !cancelEscrowId) return;

    const tx = new Transaction();
    const depositType = cancelDepositType;
    const paymentType = cancelPaymentType;

    tx.moveCall({
      target: `${PACKAGE_ID}::simple_escrow::cancel_escrow`,
      typeArguments: [depositType, paymentType],
      arguments: [tx.object(cancelEscrowId)],
    });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Escrow cancelled!", result);
          setTxDigest(result.digest);
          setTxTitle("Escrow Cancelled Successfully!");
          setTxDescription(
            "You have cancelled the escrow and received your deposit back."
          );
          setDialogOpen(true);
          client.waitForTransaction({ digest: result.digest });
          // Invalidate balance and coins queries
          queryClient.invalidateQueries({ queryKey: ["sui", "getBalance"] });
          queryClient.invalidateQueries({ queryKey: ["sui", "getCoins"] });
        },
        onError: (error) => console.error("Cancel failed:", error),
      }
    );
  };

  return (
    <>
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        digest={txDigest}
        title={txTitle}
        description={txDescription}
      />
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Escrow Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create" asChild>
                <Button variant="noShadow">Create</Button>
              </TabsTrigger>
              <TabsTrigger value="accept" asChild>
                <Button variant="noShadow">Accept</Button>
              </TabsTrigger>

              <TabsTrigger value="cancel" asChild>
                <Button variant="noShadow">Cancel</Button>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Deposit Coin Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={isCustomDeposit ? "custom" : depositCoinType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "custom") {
                      setIsCustomDeposit(true);
                      setDepositCoinType("");
                    } else {
                      setIsCustomDeposit(false);
                      setDepositCoinType(value);
                    }
                    setDepositCoinId(""); // Reset selection when type changes
                  }}
                >
                  {coinTypes.map((coin) => (
                    <option key={coin.value} value={coin.value}>
                      {coin.label}
                    </option>
                  ))}
                </select>
                {isCustomDeposit && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom coin type (e.g. 0x...::module::COIN)"
                    value={depositCoinType}
                    onChange={(e) => setDepositCoinType(e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium">
                  Select Coin to Deposit
                </label>
                {availableDepositCoins.length > 0 ? (
                  <select
                    className="w-full p-2 border rounded"
                    value={depositCoinId}
                    onChange={(e) => {
                      setDepositCoinId(e.target.value);
                      const selectedCoin = availableDepositCoins.find(
                        (c) => c.coinObjectId === e.target.value
                      );
                      if (selectedCoin) {
                        const balance = (
                          Number(selectedCoin.balance) / 1_000_000_000
                        ).toString();
                        setDepositAmount(balance);
                        setRequestedAmount(balance);
                      }
                    }}
                  >
                    <option value="">Select a coin</option>
                    {availableDepositCoins.map((coin) => (
                      <option key={coin.coinObjectId} value={coin.coinObjectId}>
                        {coin.coinObjectId.slice(0, 6)}...
                        {coin.coinObjectId.slice(-4)} - {(Number(coin.balance) / 1_000_000_000).toFixed(2)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">
                    No coins of this type in your wallet
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Deposit Amount</label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepositAmount(val);
                    setRequestedAmount(val);
                  }}
                  step="0.000000001"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Payment Coin Type (Requested)
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={isCustomPayment ? "custom" : paymentCoinType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "custom") {
                      setIsCustomPayment(true);
                      setPaymentCoinType("");
                    } else {
                      setIsCustomPayment(false);
                      setPaymentCoinType(value);
                    }
                  }}
                >
                  {coinTypes.map((coin) => (
                    <option
                      key={coin.value}
                      value={coin.value}
                      disabled={
                        coin.value !== "custom" &&
                        coin.value === depositCoinType
                      }
                    >
                      {coin.label}
                      {coin.value !== "custom" && coin.value === depositCoinType
                        ? " (same as deposit)"
                        : ""}
                    </option>
                  ))}
                </select>
                {isCustomPayment && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom coin type (e.g. 0x...::module::COIN)"
                    value={paymentCoinType}
                    onChange={(e) => setPaymentCoinType(e.target.value)}
                  />
                )}
                {depositCoinType === paymentCoinType && (
                  <p className="text-sm text-red-500 mt-1">
                    ⚠️ Deposit and payment coin must be different
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Requested Amount (1:1 Match)
                  </label>
                </div>
                <Input
                  type="number"
                  placeholder="1"
                  value={requestedAmount}
                  readOnly
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                  step="0.000000001"
                  min="0"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={
                  !account ||
                  !depositCoinId ||
                  depositCoinType === paymentCoinType
                }
              >
                Create Escrow
              </Button>
            </TabsContent>

            <TabsContent value="accept" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Escrow Object ID</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={acceptEscrowId}
                  onChange={(e) => setAcceptEscrowId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Deposit Coin Type (What you receive) - Auto-detected
                </label>
                <Input
                  type="text"
                  value={
                    coinTypes.find((c) => c.value === acceptDepositType)
                      ?.label || acceptDepositType
                  }
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Payment Coin Type (What you pay) - Auto-detected
                </label>
                <Input
                  type="text"
                  value={
                    coinTypes.find((c) => c.value === acceptPaymentType)
                      ?.label || acceptPaymentType
                  }
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              {escrowObject?.data?.content?.dataType === "moveObject" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      You Will Receive
                    </label>
                    <p className="text-lg font-bold text-green-600">
                      {(
                        Number(
                          (
                            escrowObject.data.content.fields as Record<
                              string,
                              unknown
                            >
                          ).deposit ||
                            (
                              (
                                escrowObject.data.content.fields as Record<
                                  string,
                                  unknown
                                >
                              ).deposit as { fields: { value: string } }
                            )?.fields?.value ||
                            (
                              (
                                escrowObject.data.content.fields as Record<
                                  string,
                                  unknown
                                >
                              ).deposit as { fields: { balance: string } }
                            )?.fields?.balance ||
                            0
                        ) / 1_000_000_000
                      ).toFixed(2)}{" "}
                      {coinTypes.find((c) => c.value === acceptDepositType)
                        ?.label || "Coins"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      You Will Pay
                    </label>
                    <p className="text-lg font-bold text-red-600">
                      {(
                        Number(
                          (
                            escrowObject.data.content.fields as Record<
                              string,
                              unknown
                            >
                          ).requested_amount || 0
                        ) / 1_000_000_000
                      ).toFixed(2)}{" "}
                      {coinTypes.find((c) => c.value === acceptPaymentType)
                        ?.label || "Coins"}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">
                  Selected Payment Coin - Auto-selected
                </label>
                {availablePaymentCoins.length > 0 ? (
                  <Input
                    type="text"
                    value={
                      acceptPaymentCoinId
                        ? `${acceptPaymentCoinId.slice(
                            0,
                            6
                          )}...${acceptPaymentCoinId.slice(-4)} - ${(
                            Number(
                              availablePaymentCoins.find(
                                (c) => c.coinObjectId === acceptPaymentCoinId
                              )?.balance || 0
                            ) / 1_000_000_000
                          ).toFixed(2)}`
                        : "No coin selected"
                    }
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <p className="text-sm text-red-500">
                    ⚠️ No payment coins of this type in your wallet
                  </p>
                )}
              </div>
              {escrowObject?.data?.content?.dataType === "moveObject" &&
                (escrowObject.data.content.fields as Record<string, unknown>)
                  .creator === account?.address && (
                  <p className="text-sm text-yellow-600 font-medium mb-2">
                    ⚠️ Warning: You are the creator of this escrow. Accepting it
                    means swapping with yourself.
                  </p>
                )}
              <Button
                onClick={handleAccept}
                disabled={!account || !acceptEscrowId || !acceptPaymentCoinId}
              >
                Accept Escrow
              </Button>
            </TabsContent>

            <TabsContent value="cancel" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Escrow Object ID</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={cancelEscrowId}
                  onChange={(e) => setCancelEscrowId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Deposit Coin Type - Auto-detected
                </label>
                <Input
                  type="text"
                  value={
                    coinTypes.find((c) => c.value === cancelDepositType)
                      ?.label || cancelDepositType
                  }
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Payment Coin Type - Auto-detected
                </label>
                <Input
                  type="text"
                  value={
                    coinTypes.find((c) => c.value === cancelPaymentType)
                      ?.label || cancelPaymentType
                  }
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <p className="text-sm text-red-600">
                ⚠️ Cancel escrow to get your deposit back. Only works if no
                buyer has paid yet.
              </p>
              <Button
                onClick={handleCancel}
                disabled={!account || !cancelEscrowId}
              >
                Cancel Escrow
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
