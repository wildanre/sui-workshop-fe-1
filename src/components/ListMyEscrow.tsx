import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PACKAGE_ID =
  "0xfe02aaaf954b752272ea188d398e36d1d117d3641f4b90d21b2f0df3dfcf18a2";

interface MoveCallCommand {
  MoveCall: {
    package: string;
    module: string;
    function: string;
    type_arguments: string[];
    arguments: Array<
      | { Input: number }
      | { Result: number }
      | { NestedResult: [number, number] }
    >;
  };
}

interface EscrowFields {
  requested_amount: string;
  [key: string]: unknown;
}

export default function ListMyEscrow() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: escrows, isLoading } = useQuery({
    queryKey: ["my-escrows", account?.address],
    queryFn: async () => {
      if (!account?.address) return [];

      const txs = await client.queryTransactionBlocks({
        filter: {
          FromAddress: account.address,
        },
        options: {
          showInput: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });

      const createdEscrows = txs.data.flatMap((tx) => {
        const transaction = tx.transaction?.data.transaction;
        if (transaction?.kind !== "ProgrammableTransaction") return [];

        return transaction.transactions.flatMap((cmd: unknown) => {
          const moveCall = (cmd as MoveCallCommand).MoveCall;
          if (
            moveCall &&
            moveCall.package === PACKAGE_ID &&
            moveCall.module === "simple_escrow" &&
            moveCall.function === "create_escrow"
          ) {
            const createdObject = tx.objectChanges?.find(
              (change) =>
                change.type === "created" &&
                change.objectType.startsWith(
                  `${PACKAGE_ID}::simple_escrow::Escrow`
                )
            );

            if (!createdObject || createdObject.type !== "created") return [];

            const arg1 = moveCall.arguments[1];
            const inputIndex = "Input" in arg1 ? arg1.Input : undefined;

            return {
              id: createdObject.objectId,
              digest: tx.digest,
              depositType: moveCall.type_arguments[0],
              paymentType: moveCall.type_arguments[1],
              requestedAmountInputIndex: inputIndex,
              inputs: transaction.inputs,
            };
          }
          return [];
        });
      });

      const objectIds = createdEscrows.map((e) => e.id);
      if (objectIds.length === 0) return [];

      const objects = await client.multiGetObjects({
        ids: objectIds,
        options: { showContent: true },
      });

      return createdEscrows.map((escrow) => {
        const obj = objects.find((o) => o.data?.objectId === escrow.id);
        const isClosed = !obj?.data;

        let requestedAmount = "Unknown";

        if (typeof escrow.requestedAmountInputIndex === "number") {
          const input = escrow.inputs[escrow.requestedAmountInputIndex];
          if (input.type === "pure") {
            requestedAmount = input.value as string;
          }
        }

        if (!isClosed && obj?.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as unknown as EscrowFields;
          requestedAmount = fields.requested_amount;
        }

        return {
          id: escrow.id,
          depositType: escrow.depositType,
          paymentType: escrow.paymentType,
          requestedAmount: (Number(requestedAmount) / 1_000_000_000).toString(),
          status: isClosed ? "Closed" : "Open",
          digest: escrow.digest,
        };
      });
    },
    enabled: !!account,
  });

  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Escrows</h2>
      {escrows?.length === 0 ? (
        <p>No escrows found.</p>
      ) : (
        <div className="grid gap-4">
          {escrows?.map((escrow) => (
            <Card key={escrow.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-base">
                  <div className="flex items-center gap-2">
                    <span>
                      ID: {escrow.id.slice(0, 6)}...{escrow.id.slice(-4)}
                    </span>
                    <Button
                      variant="neutral"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(escrow.id);
                        setCopiedId(escrow.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copy Object ID"
                    >
                      {copiedId === escrow.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      escrow.status === "Open"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {escrow.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-semibold">Deposit:</span>{" "}
                  {escrow.depositType.split("::").pop()}
                </div>
                <div>
                  <span className="font-semibold">Request:</span>{" "}
                  {escrow.requestedAmount}{" "}
                  {escrow.paymentType.split("::").pop()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
