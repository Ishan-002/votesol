use anchor_lang::prelude::*;

declare_id!("HWFFMkkxfV2xSpxytZQaEDP1QCYLKG71Vxt7bZ6zgFhK");

#[program]
pub mod votesol {
    use super::*;

    pub fn create_ballot(ctx: Context<CreateBallot>) -> Result<()> {
        ctx.accounts.ballot_box.left_votes = 0;
        ctx.accounts.ballot_box.right_votes = 0;
        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, vote_option: VoteOption) -> Result<()> {
        let ballot_box = &mut ctx.accounts.ballot_box;
        match vote_option {
            VoteOption::LeftVote => {
                // ToDo: Error handling using the below line
                // ballot_box.left_votes.checked_add(1).ok_or(Errors::LeftVotesOverflow);
                ballot_box.left_votes.checked_add(1).unwrap();
            }
            VoteOption::RightVote => {
                ballot_box.right_votes.checked_add(1).unwrap();
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateBallot<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(init, space=BallotBox::LEN, payer=authority)]
    ballot_box: Account<'info, BallotBox>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    ballot_box: Account<'info, BallotBox>,
}

#[account]
pub struct BallotBox {
    pub left_votes: u64,
    pub right_votes: u64,
}

impl BallotBox {
    const LEN: usize = 8 + 8;
}

// Anchor serialise, deserialise, and other functions are required in order to use this enum in the Anchor runtime function vote().
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteOption {
    LeftVote,
    RightVote,
}

// This enum can be freely used unlike VoteOption since it's usage is in pure logic and not where Anchor would need to do some processing(like VoteOption).i
pub enum Errors {
    LeftVotesOverflow,
    RightVotesOverflow,
}
