#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

fn setup() -> (Env, LumenRanksClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(LumenRanks, ());
    let client = LumenRanksClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(
        &admin,
        &String::from_str(&env, "LumenRanks Token"),
        &String::from_str(&env, "LUMR"),
        &7,
    );
    (env, client, admin)
}

#[test]
fn test_initialize_sets_meta_and_admin() {
    let (env, client, admin) = setup();
    let meta = client.get_meta();
    assert_eq!(meta.name, String::from_str(&env, "LumenRanks Token"));
    assert_eq!(meta.symbol, String::from_str(&env, "LUMR"));
    assert_eq!(meta.decimals, 7);
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.total_supply(), 0);
    assert_eq!(client.holder_count(), 0);
}

#[test]
fn test_double_initialize_fails() {
    let (env, client, admin) = setup();
    let result = client.try_initialize(
        &admin,
        &String::from_str(&env, "Again"),
        &String::from_str(&env, "AGN"),
        &7,
    );
    assert_eq!(result, Err(Ok(LumenRanksError::AlreadyInitialized.into())));
}

#[test]
fn test_uninitialized_errors() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(LumenRanks, ());
    let client = LumenRanksClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    assert_eq!(
        client.try_get_meta(),
        Err(Ok(LumenRanksError::NotInitialized.into()))
    );
    assert_eq!(
        client.try_get_admin(),
        Err(Ok(LumenRanksError::NotInitialized.into()))
    );
    assert_eq!(
        client.try_mint(&user, &user, &100),
        Err(Ok(LumenRanksError::NotInitialized.into()))
    );
    assert_eq!(
        client.try_balance(&user),
        Err(Ok(LumenRanksError::NotInitialized.into()))
    );
    assert_eq!(
        client.try_get_leaderboard(&0),
        Err(Ok(LumenRanksError::NotInitialized.into()))
    );
}

#[test]
fn test_set_admin_hands_over_role() {
    let (env, client, admin) = setup();
    let new_admin = Address::generate(&env);
    let alice = Address::generate(&env);

    client.set_admin(&admin, &new_admin);
    assert_eq!(client.get_admin(), new_admin);

    // Old admin can no longer mint; new admin can.
    assert_eq!(
        client.try_mint(&admin, &alice, &100),
        Err(Ok(LumenRanksError::NotAdmin.into()))
    );
    client.mint(&new_admin, &alice, &100);
    assert_eq!(client.balance(&alice), 100);

    // A random address can't grab the role either.
    assert_eq!(
        client.try_set_admin(&admin, &alice),
        Err(Ok(LumenRanksError::NotAdmin.into()))
    );
}

#[test]
fn test_mint() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    client.mint(&admin, &alice, &1_000);
    assert_eq!(client.balance(&alice), 1_000);
    assert_eq!(client.total_supply(), 1_000);
    assert_eq!(client.holder_count(), 1);

    // Minting again accumulates without duplicating the holder entry.
    client.mint(&admin, &alice, &500);
    assert_eq!(client.balance(&alice), 1_500);
    assert_eq!(client.total_supply(), 1_500);
    assert_eq!(client.holder_count(), 1);
}

#[test]
fn test_mint_requires_admin() {
    let (env, client, _admin) = setup();
    let impostor = Address::generate(&env);
    let alice = Address::generate(&env);
    assert_eq!(
        client.try_mint(&impostor, &alice, &100),
        Err(Ok(LumenRanksError::NotAdmin.into()))
    );
}

#[test]
fn test_mint_invalid_amount() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    assert_eq!(
        client.try_mint(&admin, &alice, &0),
        Err(Ok(LumenRanksError::InvalidAmount.into()))
    );
    assert_eq!(
        client.try_mint(&admin, &alice, &-5),
        Err(Ok(LumenRanksError::InvalidAmount.into()))
    );
}

#[test]
fn test_transfer() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    client.mint(&admin, &alice, &1_000);
    client.transfer(&alice, &bob, &400);
    assert_eq!(client.balance(&alice), 600);
    assert_eq!(client.balance(&bob), 400);
    assert_eq!(client.total_supply(), 1_000);
    assert_eq!(client.holder_count(), 2);
}

#[test]
fn test_transfer_insufficient_balance() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    client.mint(&admin, &alice, &100);
    assert_eq!(
        client.try_transfer(&alice, &bob, &101),
        Err(Ok(LumenRanksError::InsufficientBalance.into()))
    );
    // Balances untouched.
    assert_eq!(client.balance(&alice), 100);
    assert_eq!(client.balance(&bob), 0);
}

#[test]
fn test_self_transfer_fails() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    client.mint(&admin, &alice, &100);
    assert_eq!(
        client.try_transfer(&alice, &alice, &10),
        Err(Ok(LumenRanksError::SelfTransfer.into()))
    );
}

#[test]
fn test_burn() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    client.mint(&admin, &alice, &1_000);
    client.burn(&alice, &300);
    assert_eq!(client.balance(&alice), 700);
    assert_eq!(client.total_supply(), 700);

    assert_eq!(
        client.try_burn(&alice, &701),
        Err(Ok(LumenRanksError::InsufficientBalance.into()))
    );
    assert_eq!(
        client.try_burn(&alice, &0),
        Err(Ok(LumenRanksError::InvalidAmount.into()))
    );
}

#[test]
fn test_leaderboard_ordering_and_truncation() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    client.mint(&admin, &alice, &100);
    client.mint(&admin, &bob, &300);
    client.mint(&admin, &carol, &200);

    // limit 0 => full leaderboard, sorted by balance desc.
    let board = client.get_leaderboard(&0);
    assert_eq!(board.len(), 3);
    assert_eq!(board.get_unchecked(0).address, bob);
    assert_eq!(board.get_unchecked(0).balance, 300);
    assert_eq!(board.get_unchecked(1).address, carol);
    assert_eq!(board.get_unchecked(1).balance, 200);
    assert_eq!(board.get_unchecked(2).address, alice);
    assert_eq!(board.get_unchecked(2).balance, 100);

    // Truncation.
    let top2 = client.get_leaderboard(&2);
    assert_eq!(top2.len(), 2);
    assert_eq!(top2.get_unchecked(0).address, bob);
    assert_eq!(top2.get_unchecked(1).address, carol);

    // Limit larger than holder count returns everything.
    let top10 = client.get_leaderboard(&10);
    assert_eq!(top10.len(), 3);
}

#[test]
fn test_get_rank() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    let nobody = Address::generate(&env);
    client.mint(&admin, &alice, &100);
    client.mint(&admin, &bob, &300);
    client.mint(&admin, &carol, &200);

    assert_eq!(client.get_rank(&bob), 1);
    assert_eq!(client.get_rank(&carol), 2);
    assert_eq!(client.get_rank(&alice), 3);
    assert_eq!(client.get_rank(&nobody), 0);
}

#[test]
fn test_holder_count_add_and_remove() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.mint(&admin, &alice, &500);
    assert_eq!(client.holder_count(), 1);

    // Alice sends her full balance: she drops out, Bob comes in.
    client.transfer(&alice, &bob, &500);
    assert_eq!(client.holder_count(), 1);
    assert_eq!(client.balance(&alice), 0);
    assert_eq!(client.get_rank(&alice), 0);
    assert_eq!(client.get_rank(&bob), 1);

    // Bob burns everything: no holders left.
    client.burn(&bob, &500);
    assert_eq!(client.holder_count(), 0);
    assert_eq!(client.total_supply(), 0);
    assert_eq!(client.get_leaderboard(&0).len(), 0);
}
