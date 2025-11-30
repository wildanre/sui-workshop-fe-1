"use client";

import { Transaction } from "@mysten/sui/transactions";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionDialog } from "@/components/ui/dialog-transaction";
import { useState } from "react";

const PACKAGE_ID =
  "0xfe02aaaf954b752272ea188d398e36d1d117d3641f4b90d21b2f0df3dfcf18a2";
const FAUCET_ID =
  "0x4f5135f2706e1371adf34002e351c76d9c42d0b3a10c0a5dcc32e0f7605d48b0";

type CoinType = "MOCK_COIN" | "MOCK_TBTC" | "MOCK_ZSUI";

const coinConfigs = {
  MOCK_COIN: {
    label: "Mock Coin",
    typeArg: `${PACKAGE_ID}::mock_coin::MOCK_COIN`,
  },
  MOCK_TBTC: {
    label: "Mock TBTC",
    typeArg: `${PACKAGE_ID}::mock_tbtc::MOCK_TBTC`,
  },
  MOCK_ZSUI: {
    label: "Mock zSUI",
    typeArg: `${PACKAGE_ID}::mock_zsui::MOCK_ZSUI`,
  },
};

function FaucetTab({ coinType }: { coinType: CoinType }) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txDigest, setTxDigest] = useState("");

  const config = coinConfigs[coinType];

  const handleClaim = () => {
    if (!account) return;

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::faucet::claim`,
      typeArguments: [config.typeArg],
      arguments: [tx.object(FAUCET_ID), tx.object("0x6")],
    });

    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log(`${config.label} claim successful!`, result);
          setTxDigest(result.digest);
          setDialogOpen(true);
          client.waitForTransaction({ digest: result.digest });
          // Invalidate balance queries to refresh balance display
          queryClient.invalidateQueries({ queryKey: ["sui", "getBalance"] });
        },
        onError: (error) => {
          console.error(`${config.label} claim failed:`, error);
        },
      }
    );
  };

  return (
    <>
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        digest={txDigest}
        title={`${config.label} Claimed Successfully!`}
        description={`You have successfully claimed 10,000 ${config.label}.`}
      />
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          You can claim 10,000 {config.label} every 1 minute.
        </div>
        <Button onClick={handleClaim} disabled={!account}>
          Claim {config.label}
        </Button>
      </div>
    </>
  );
}

export default function Faucet() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Faucet</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mock_coin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mock_coin" asChild>
              <Button variant="noShadow">Mock Coin</Button>
            </TabsTrigger>
            <TabsTrigger value="mock_tbtc" asChild>
              <Button variant="noShadow">Mock TBTC</Button>
            </TabsTrigger>
            <TabsTrigger value="mock_zsui" asChild>
              <Button variant="noShadow">Mock zSUI</Button>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mock_coin">
            <FaucetTab coinType="MOCK_COIN" />
          </TabsContent>

          <TabsContent value="mock_tbtc">
            <FaucetTab coinType="MOCK_TBTC" />
          </TabsContent>

          <TabsContent value="mock_zsui">
            <FaucetTab coinType="MOCK_ZSUI" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
