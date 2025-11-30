module escrow::faucet {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::dynamic_field as df;
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// Error code when user tries to claim too soon
    const E_ALREADY_CLAIMED: u64 = 1;

    /// Amount to dispense per claim (10,000 * 10^9)
    const CLAIM_AMOUNT: u64 = 10_000_000_000_000; 

    /// Claim interval in milliseconds (1 minute)
    const CLAIM_INTERVAL: u64 = 60000; 

    /// Shared object that holds coin balances
    public struct Faucet has key {
        id: UID,
    }

    /// Dynamic field key for a specific coin type
    public struct Key<phantom T> has copy, drop, store {}

    /// Internal struct to store balance and claim records for a coin type
    public struct Wallet<phantom T> has store {
        balance: Balance<T>,
        claims: Table<address, u64>,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Faucet {
            id: object::new(ctx)
        })
    }

    /// Add coins to the faucet. Can be called by anyone (usually admin).
    public entry fun top_up<T>(faucet: &mut Faucet, coin: Coin<T>, ctx: &mut TxContext) {
        if (!df::exists_(&faucet.id, Key<T> {})) {
            let wallet = Wallet<T> {
                balance: coin::into_balance(coin),
                claims: table::new(ctx),
            };
            df::add(&mut faucet.id, Key<T> {}, wallet);
        } else {
            let wallet = df::borrow_mut<Key<T>, Wallet<T>>(&mut faucet.id, Key<T> {});
            balance::join(&mut wallet.balance, coin::into_balance(coin));
        }
    }

    /// Claim coins from the faucet. Rate limited to once per minute per coin type.
    public entry fun claim<T>(faucet: &mut Faucet, clock: &Clock, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        // Ensure wallet exists for this coin type
        assert!(df::exists_(&faucet.id, Key<T> {}), 0);
        
        let wallet = df::borrow_mut<Key<T>, Wallet<T>>(&mut faucet.id, Key<T> {});
        
        let current_time = clock::timestamp_ms(clock);
        
        // Check rate limit
        if (table::contains(&wallet.claims, sender)) {
            let last_claim = *table::borrow(&wallet.claims, sender);
            assert!(current_time >= last_claim + CLAIM_INTERVAL, E_ALREADY_CLAIMED);
            *table::borrow_mut(&mut wallet.claims, sender) = current_time;
        } else {
            table::add(&mut wallet.claims, sender, current_time);
        };

        // Dispense coins
        let amount = CLAIM_AMOUNT;
        // If balance is insufficient, this will abort with standard balance error
        let coin = coin::take(&mut wallet.balance, amount, ctx);
        transfer::public_transfer(coin, sender);
    }
}
