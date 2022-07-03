import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Votesol } from '../target/types/votesol';

// For JS/TS: use camelCase
// For Rust: use snake_case => All the rust structures/keyworks/variable-names have been parsed and changed to CamelCase which are used in JS/TS

describe('votesol', () => {
  // Configure the client to use the local cluster.
  const anchorProvider = anchor.AnchorProvider.env();
  anchor.setProvider(anchorProvider);

  const wallet = anchorProvider.wallet;
  const systemProgram = anchor.web3.SystemProgram;
  const program = anchor.workspace.Votesol as Program<Votesol>;

  // Note: Initialisation is different from init. Initialisation gives inital values,
  // while init was already done when instruction was writting in #[account(init, ...)]
  // Hence, as we can see, createBallot() is used in the test.
  it('Program initialised', async () => {
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );

    const tx = await program.methods
      .createBallot()
      .accounts({
        authority: wallet.publicKey,
        ballotBox: ballotPDA,
        systemProgram: systemProgram.programId,
      })
      .rpc();

    console.log('Initialisation transaction: ', tx);
  });

  it('Fetched the ballot box', async () => {
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );
    console.log('Ballot box public key: ', ballotPDA);

    const ballotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Ballot box: ', ballotBox);
    /* 
    Ballot box: {
      leftVotes: <BN: 0>,
      rightVotes: <BN: 0>,
      voteOption: { leftVote: {} }
    }
    */
  });

  it('Voted for left', async () => {
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );

    const originalBallotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Original left votes: ', originalBallotBox.leftVotes);
    /* 
    Rust enums are very different from C++ or TS enums. rust enums are a way to represent a set of structs together.
    Rust enums are tagged unions(dunno what this means), TS enums are not.
    So, the syntax to use the rust enum in TS is `const AnyName = { yourVariantName: { ... } }`
    For our case, { leftVote: 0 } or { rightVote: 1 }
    Refer: https://github.com/coral-xyz/anchor/blob/master/tests/lockup/tests/lockup.js#L475
           https://github.com/coral-xyz/anchor/blob/master/tests/lockup/programs/registry/src/lib.rs#L1167
    */
    const VoteOption = {
      leftVote: 0, // variantName : {}
    };
    const tx = await program.methods
      .vote(VoteOption) // enum as the parameter
      .accounts({
        ballotBox: ballotPDA,
      })
      .signers([])
      .rpc();

    const updatedBallotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Updated left votes: ', updatedBallotBox.leftVotes);

    console.log('Vote transaction: ', tx);
  });
});
