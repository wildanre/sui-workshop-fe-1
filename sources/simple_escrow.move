module escrow::simple_escrow {
    use sui::balance;
    use sui::balance::Balance;
    use sui::coin;
    use sui::coin::Coin;

    /// Escrow untuk swap antara dua tipe koin berbeda.
    /// DepositCoinType: tipe koin yang di-deposit oleh seller
    /// PaymentCoinType: tipe koin yang harus dibayar oleh buyer
    public struct Escrow<phantom DepositCoinType, phantom PaymentCoinType> has key, store {
        id: object::UID,
        deposit: Balance<DepositCoinType>,
        requested_amount: u64,
        creator: address,
    }

    /// Seller kunci koin miliknya (DepositCoinType), tentukan jumlah PaymentCoinType yang diminta dari buyer.
    /// Contoh: Seller deposit TBTC, minta zSUI sebagai pembayaran.
    public entry fun create_escrow<DepositCoinType, PaymentCoinType>(
        deposit_coin: Coin<DepositCoinType>,
        request_amount: u64,
        ctx: &mut TxContext,
    ) {
        let escrow = Escrow<DepositCoinType, PaymentCoinType> {
            id: object::new(ctx),
            deposit: coin::into_balance(deposit_coin),
            requested_amount: request_amount,
            creator: ctx.sender(),
        };

        transfer::public_share_object(escrow);
    }

    /// Buyer kirim koin PaymentCoinType sesuai request.
    /// Payment langsung dikirim ke creator (seller).
    /// Deposit langsung dikirim ke buyer (sender).
    /// Object Escrow dihapus.
    public entry fun accept_escrow<DepositCoinType, PaymentCoinType>(
        escrow: Escrow<DepositCoinType, PaymentCoinType>,
        payment: Coin<PaymentCoinType>,
        ctx: &mut TxContext,
    ) {
        assert!(coin::value(&payment) == escrow.requested_amount, 0);

        let Escrow {
            id,
            deposit,
            requested_amount: _,
            creator,
        } = escrow;

        // Transfer payment to creator
        transfer::public_transfer(payment, creator);

        // Transfer deposit to buyer
        let deposit_coin = coin::from_balance(deposit, ctx);
        transfer::public_transfer(deposit_coin, ctx.sender());

        // Delete escrow object
        object::delete(id);
    }

    /// Seller batalkan escrow, deposit dikembalikan ke seller.
    public entry fun cancel_escrow<DepositCoinType, PaymentCoinType>(
        escrow: Escrow<DepositCoinType, PaymentCoinType>,
        ctx: &mut TxContext,
    ) {
        assert!(ctx.sender() == escrow.creator, 3);

        let Escrow {
            id,
            deposit,
            requested_amount: _,
            creator: _,
        } = escrow;

        let coin_out = coin::from_balance(deposit, ctx);
        object::delete(id);
        transfer::public_transfer(coin_out, ctx.sender());
    }
}
