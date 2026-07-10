#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Symbol};


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeedbackItem {
    pub id: u32,
    pub user: String,
    pub message: String,
}

#[contracttype]
pub enum DataKey {
    Counter,         
    Feedback(u32),    
}

#[contract]
pub struct FeedbackContract;

#[contractimpl]
impl FeedbackContract {
    pub fn send_feedback(env: Env, user: String, message: String) -> FeedbackItem {
        let counter_key = DataKey::Counter;
        
        let current_id: u32 = env
            .storage()
            .instance()
            .get(&counter_key)
            .unwrap_or(0);
        
        let new_id = current_id + 1;
        
        let new_feedback = FeedbackItem {
            id: new_id,
            user: user.clone(),
            message: message.clone(),
        };
        
        env.storage().persistent().set(&DataKey::Feedback(new_id), &new_feedback);
        
        env.storage().instance().set(&counter_key, &new_id);
        
        new_feedback
    }

    pub fn get_feedback_by_id(env: Env, id: u32) -> Option<FeedbackItem> {
        env.storage().persistent().get(&DataKey::Feedback(id))
    }

    pub fn get_total_feedbacks(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }
}