import { useSuiClientQuery, useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent } from "./ui/card";

const PACKAGE_ID =
  "0xfe02aaaf954b752272ea188d398e36d1d117d3641f4b90d21b2f0df3dfcf18a2";

export default function Balance() {
  const account = useCurrentAccount();

  // Native SUI balance
  const { data: suiData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    }
  );

  // Mock Coin balance
  const { data: mockCoinData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
      coinType: `${PACKAGE_ID}::mock_coin::MOCK_COIN`,
    },
    {
      enabled: !!account,
    }
  );

  // Mock TBTC balance
  const { data: mockTbtcData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
      coinType: `${PACKAGE_ID}::mock_tbtc::MOCK_TBTC`,
    },
    {
      enabled: !!account,
    }
  );

  // Mock zSUI balance
  const { data: mockZsuiData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
      coinType: `${PACKAGE_ID}::mock_zsui::MOCK_ZSUI`,
    },
    {
      enabled: !!account,
    }
  );

  const suiBalance = Number(suiData?.totalBalance ?? 0) / 1_000_000_000;
  const mockCoinBalance =
    Number(mockCoinData?.totalBalance ?? 0) / 1_000_000_000;
  const mockTbtcBalance =
    Number(mockTbtcData?.totalBalance ?? 0) / 1_000_000_000;
  const mockZsuiBalance =
    Number(mockZsuiData?.totalBalance ?? 0) / 1_000_000_000;

  return (
    <div className="flex gap-4 flex-wrap">
      <Card className="w-fit">
        <CardContent>
          <span>SUI: {suiBalance.toFixed(2)}</span>
        </CardContent>
      </Card>
      <Card className="w-fit">
        <CardContent>
          <span>Mock Coin: {mockCoinBalance.toFixed(2)}</span>
        </CardContent>
      </Card>
      <Card className="w-fit">
        <CardContent>
          <span>Mock TBTC: {mockTbtcBalance.toFixed(2)}</span>
        </CardContent>
      </Card>
      <Card className="w-fit">
        <CardContent>
          <span>Mock zSUI: {mockZsuiBalance.toFixed(2)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
