#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, symbol_short};

#[contract]
pub struct CounterContract;

const COUNTER: Symbol = symbol_short!("COUNTER");

#[contractimpl]
impl CounterContract {
  
    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&COUNTER, &count);
        
    
        env.events().publish((symbol_short!("counter"), symbol_short!("inc")), count);
        
        count
    }


    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&COUNTER).unwrap_or(0)
    }
}