module escrow::mock_zsui {
    use sui::coin;
    use sui::coin::TreasuryCap;
    use sui::coin_registry;

    /// One-time witness untuk token mock zSUI (juga tipe koin).
    public struct MOCK_ZSUI has drop {}

    /// Initializer otomatis saat publish: create zSUI dan jadikan TreasuryCap shared untuk public minting.
    fun init(witness: MOCK_ZSUI, ctx: &mut TxContext) {
        let (builder, cap) = coin_registry::new_currency_with_otw(
            witness,
            9,
            b"zSUI".to_string(),
            b"Mock zSUI".to_string(),
            b"Mock wrapped SUI".to_string(),
            b"".to_string(),
            ctx,
        );
        let metadata_cap = coin_registry::finalize(builder, ctx);
        // Transfer TreasuryCap to sender so it can be added to Faucet
        transfer::public_transfer(cap, ctx.sender());
        transfer::public_transfer(metadata_cap, ctx.sender());
    }

    /// Mint zSUI ke caller (public untuk testing, siapa saja bisa mint).
    public entry fun mint_zsui(
        cap: &mut TreasuryCap<MOCK_ZSUI>,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        let minted = coin::mint(cap, amount, ctx);
        transfer::public_transfer(minted, ctx.sender());
    }
}
