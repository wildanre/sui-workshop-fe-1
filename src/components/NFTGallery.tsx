import { useSuiClientQuery, useCurrentAccount } from "@mysten/dapp-kit";

export function NFTGallery() {
  const account = useCurrentAccount();

  const { data, isPending, error, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      options: {
        showContent: true,
        showType: true,
        showDisplay: true,
      },
    },
    {
      enabled: !!account,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (!account) {
    return (
      <div className="nft-gallery">
        <p>Connect your wallet to view your NFTs</p>
      </div>
    );
  }

  if (isPending) {
    return <div>Loading your NFTs...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading NFTs: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const nfts = data?.data ?? [];

  return (
    <div className="nft-gallery ml-4">
      <div className="gallery-header">
        <h2>My Bini ({nfts.length})</h2>
        <button className="px-4 py-1 my-4 bg-blue-600 rounded-full border-2 cursor-pointer" onClick={() => refetch()}>Refresh</button>
      </div>

      <div className="nft-grid ">
        {nfts.map((nft) => (
          <div key={nft.data?.objectId} className="nft-card">
            <div className="nft-image">
              {nft.data?.display?.data?.image_url && (
                <img
                  src={nft.data.display.data.image_url}
                  alt={nft.data.display.data.name || "NFT"}
                />
              )}
            </div>
            <div className="nft-info">
              <h3>{nft.data?.display?.data?.name || "Unnamed"}</h3>
              <p>{nft.data?.display?.data?.description}</p>
              <code>{nft.data?.objectId}</code>
            </div>
          </div>
        ))}
      </div>

      {nfts.length === 0 && (
        <div className="empty-state">
          <p>No NFTs found in this wallet</p>
        </div>
      )}
    </div>
  );
}
