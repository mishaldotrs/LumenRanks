#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, String, Vec,
};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenMeta {
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HolderEntry {
    pub address: Address,
    pub balance: i128,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum LumenRanksError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    InvalidAmount = 4,
    InsufficientBalance = 5,
    SelfTransfer = 6,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Meta,
    TotalSupply,
    Holders,
    Balance(Address),
}

fn require_init(env: &Env) {
    if !env.storage().instance().has(&DataKey::Admin) {
        panic_with_error!(env, LumenRanksError::NotInitialized);
    }
}

fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn read_balance(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(addr.clone()))
        .unwrap_or(0)
}

fn read_holders(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::Holders)
        .unwrap_or_else(|| Vec::new(env))
}

fn write_holders(env: &Env, holders: &Vec<Address>) {
    env.storage().persistent().set(&DataKey::Holders, holders);
}

/// Writes a balance, maintaining the holder set: an address is appended when
/// its balance goes 0 -> positive and removed when it goes positive -> 0.
fn set_balance(env: &Env, addr: &Address, new_balance: i128) {
    let old_balance = read_balance(env, addr);
    let key = DataKey::Balance(addr.clone());
    if new_balance > 0 {
        env.storage().persistent().set(&key, &new_balance);
    } else {
        env.storage().persistent().remove(&key);
    }
    if old_balance == 0 && new_balance > 0 {
        let mut holders = read_holders(env);
        holders.push_back(addr.clone());
        write_holders(env, &holders);
    } else if old_balance > 0 && new_balance == 0 {
        let mut holders = read_holders(env);
        if let Some(idx) = holders.first_index_of(addr) {
            holders.remove(idx);
            write_holders(env, &holders);
        }
    }
}

fn read_total_supply(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

fn write_total_supply(env: &Env, supply: i128) {
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
}

#[contract]
pub struct LumenRanks;

#[contractimpl]
impl LumenRanks {
    /// One-time initialization: sets the admin and token metadata.
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String, decimals: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, LumenRanksError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::Meta,
            &TokenMeta {
                name,
                symbol,
                decimals,
            },
        );
        write_total_supply(&env, 0);
        write_holders(&env, &Vec::new(&env));
        extend_instance_ttl(&env);
    }

    /// Admin-only: hands the admin role over to `new_admin`.
    pub fn set_admin(env: Env, admin: Address, new_admin: Address) {
        require_init(&env);
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic_with_error!(&env, LumenRanksError::NotAdmin);
        }
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        extend_instance_ttl(&env);
        env.events()
            .publish((symbol_short!("set_admin"), admin), new_admin);
    }

    /// Admin-only: credits `to` with `amount` and increases total supply.
    pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
        require_init(&env);
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic_with_error!(&env, LumenRanksError::NotAdmin);
        }
        if amount <= 0 {
            panic_with_error!(&env, LumenRanksError::InvalidAmount);
        }
        let balance = read_balance(&env, &to);
        set_balance(&env, &to, balance + amount);
        write_total_supply(&env, read_total_supply(&env) + amount);
        extend_instance_ttl(&env);
        env.events().publish((symbol_short!("mint"), to), amount);
    }

    /// Moves `amount` from `from` to `to`.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        require_init(&env);
        from.require_auth();
        if from == to {
            panic_with_error!(&env, LumenRanksError::SelfTransfer);
        }
        if amount <= 0 {
            panic_with_error!(&env, LumenRanksError::InvalidAmount);
        }
        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic_with_error!(&env, LumenRanksError::InsufficientBalance);
        }
        let to_balance = read_balance(&env, &to);
        set_balance(&env, &from, from_balance - amount);
        set_balance(&env, &to, to_balance + amount);
        extend_instance_ttl(&env);
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    /// Destroys `amount` from `from` and decreases total supply.
    pub fn burn(env: Env, from: Address, amount: i128) {
        require_init(&env);
        from.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, LumenRanksError::InvalidAmount);
        }
        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic_with_error!(&env, LumenRanksError::InsufficientBalance);
        }
        set_balance(&env, &from, from_balance - amount);
        write_total_supply(&env, read_total_supply(&env) - amount);
        extend_instance_ttl(&env);
        env.events().publish((symbol_short!("burn"), from), amount);
    }

    /// Balance of `id`; 0 if the address never held anything.
    pub fn balance(env: Env, id: Address) -> i128 {
        require_init(&env);
        read_balance(&env, &id)
    }

    pub fn total_supply(env: Env) -> i128 {
        require_init(&env);
        read_total_supply(&env)
    }

    /// Number of addresses currently holding a positive balance.
    pub fn holder_count(env: Env) -> u32 {
        require_init(&env);
        read_holders(&env).len()
    }

    pub fn get_meta(env: Env) -> TokenMeta {
        match env.storage().instance().get(&DataKey::Meta) {
            Some(meta) => meta,
            None => panic_with_error!(&env, LumenRanksError::NotInitialized),
        }
    }

    pub fn get_admin(env: Env) -> Address {
        match env.storage().instance().get(&DataKey::Admin) {
            Some(admin) => admin,
            None => panic_with_error!(&env, LumenRanksError::NotInitialized),
        }
    }

    /// All holders sorted by balance descending (stable), truncated to
    /// `limit`. A `limit` of 0 returns the full leaderboard.
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<HolderEntry> {
        require_init(&env);
        let holders = read_holders(&env);
        let mut sorted: Vec<HolderEntry> = Vec::new(&env);
        for addr in holders.iter() {
            let balance = read_balance(&env, &addr);
            // Stable insertion sort: insert before the first strictly
            // smaller balance, so equal balances keep holder-set order.
            let mut idx = sorted.len();
            for i in 0..sorted.len() {
                if sorted.get_unchecked(i).balance < balance {
                    idx = i;
                    break;
                }
            }
            sorted.insert(
                idx,
                HolderEntry {
                    address: addr,
                    balance,
                },
            );
        }
        if limit > 0 && sorted.len() > limit {
            sorted.slice(0..limit)
        } else {
            sorted
        }
    }

    /// 1-based rank of `id` on the leaderboard; 0 if it holds nothing.
    pub fn get_rank(env: Env, id: Address) -> u32 {
        require_init(&env);
        if read_balance(&env, &id) <= 0 {
            return 0;
        }
        let leaderboard = Self::get_leaderboard(env, 0);
        for (i, entry) in leaderboard.iter().enumerate() {
            if entry.address == id {
                return (i as u32) + 1;
            }
        }
        0
    }
}

#[cfg(test)]
mod test;
