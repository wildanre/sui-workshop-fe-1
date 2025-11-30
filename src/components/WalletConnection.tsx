/* eslint-disable @next/next/no-img-element */
import {
  ConnectButton,
  useCurrentAccount,
  useCurrentWallet,
} from "@mysten/dapp-kit";
import { Card, CardContent } from "./ui/card";

export function WalletConnection() {
  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();

  // Show connect button if not connected
  if (!currentAccount) {
    return (
      <div className="wallet-connect">
        <h3>Connect Your Wallet</h3>
        <ConnectButton />
      </div>
    );
  }

  // Show account info when connected
  return (
    <div className="wallet-info">
      <Card className="w-fit">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <img
              src={currentWallet?.icon}
              alt={currentWallet?.name}
              width={24}
              height={24}
            />
            <span>{currentWallet?.name}</span>
          </div>
          <ConnectButton />
        </CardContent>
      </Card>
    </div>
  );
}
