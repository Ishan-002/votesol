use anchor_lang::prelude::*;

declare_id!("HWFFMkkxfV2xSpxytZQaEDP1QCYLKG71Vxt7bZ6zgFhK");

#[program]
pub mod votesol {
    use super::*;

    pub fn create_ballot(ctx: Context<CreateBallot>) -> Result<()> {
        // ctx.accounts.ballot_box.left_votes = 0;
        // ctx.accounts.ballot_box.right_votes = 0;
        // ctx.accounts.ballot_box.bump = ballot_box_bump;
        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, vote_option: VoteOption) -> Result<()> {
        let ballot_box = &mut ctx.accounts.ballot_box;
        // let ballot_box = &mut ctx.accounts.ballot_box;
        match vote_option {
            // ToDo: Error handling using the below line
            // ballot_box.left_votes.checked_add(1).ok_or(Errors::LeftVotesOverflow);
            VoteOption::LeftVote => {
                ballot_box.left_votes = ballot_box.left_votes.checked_add(1).unwrap();
            }
            VoteOption::RightVote => {
                ballot_box.right_votes = ballot_box.right_votes.checked_add(1).unwrap();
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateBallot<'info> {
    #[account(mut)] // mutable since the authority is the payer
    authority: Signer<'info>,
    // here store the authority's public key as the seeds. And bump can be calculated automatically, hence no value given.
    // A better way to do this could be storing the bump in the voting account itself.
    // As Solana cookbook says: This allows developers to easily validate a PDA without having to pass in the bump as an instruction argument.
    // But if you use this approach then do remember to change the LEN.
    // Update: "ballot_box" as the seeds and not the public key of authority, else Vote would have SystemProgram needed too.
    #[account(init, space=BallotBox::LEN, seeds=[b"ballot_box".as_ref()], bump, payer=authority)]
    ballot_box: Account<'info, BallotBox>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut, seeds=[b"ballot_box".as_ref()], bump)]
    pub ballot_box: Account<'info, BallotBox>,
    // pub authority: Signer<'info>,
}

#[account]
#[derive(Default)] // default macro gives default values to the fields of the struct, hence now they are not initialised in the create_ballot function
pub struct BallotBox {
    pub left_votes: u64,
    pub right_votes: u64,
    // pub bump: u8,
}

const UNSIGNED64_LENGTH: usize = 8;
// An account discriminator is few bytes that Anchor puts at the front of an account, like a header.
// It lets anchor know what type of account it should deserialize the data as.
const DISCRIMINATOR_LENGTH: usize = 8;

impl BallotBox {
    const LEN: usize = DISCRIMINATOR_LENGTH + UNSIGNED64_LENGTH + UNSIGNED64_LENGTH;
    // I cannot store bump in the implementation here, since it would be decided at runtime when the owner of the create_ballot program calls it.
}

// Anchor serialise, deserialise, and other functions are required in order to use this enum in the Anchor runtime function vote().
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteOption {
    LeftVote = 0,
    RightVote = 1,
}

// This enum can be freely used unlike VoteOption since it's usage is in pure logic and not where Anchor would need to do some processing(like VoteOption).i
pub enum Errors {
    LeftVotesOverflow,
    RightVotesOverflow,
}
