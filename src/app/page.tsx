"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnection } from "@/components/WalletConnection";
import Faucet from "@/components/transaction/Faucet";
import Escrow from "@/components/transaction/Escrow";
import Balance from "@/components/Balance";
import { NFTGallery } from "@/components/NFTGallery";
import ListMyEscrow from "@/components/ListMyEscrow";

export default function page() {
  return (
    <div className="gap-4 flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">
            Workshop SUI - Frontend
          </CardTitle>
          <div className=" justify-start mb-4 gap-8">
            <WalletConnection />
          </div>
          <Balance />
        </CardHeader>
      </Card>
      <Card>
        <CardContent className=" gap-2">
          <Faucet />
          <Escrow />
          <ListMyEscrow />
        </CardContent>
      </Card>
    </div>
  );
}
