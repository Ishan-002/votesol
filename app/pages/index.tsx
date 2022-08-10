import type { NextPage } from 'next';
import Head from 'next/head';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import * as anchor from '@project-serum/anchor';
import {
  useAnchorWallet,
  AnchorWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import React, { useState, useEffect } from 'react';

import idl_type from '../../target/idl/votesol.json';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';

const Home: NextPage = () => {
  const connection = useConnection();
  const wallet: AnchorWallet | any = useAnchorWallet();
  // the options for the provider constructor
  const opts = { preflighCommitment: 'processed' as ConfirmOptions };
  const [programState, setProgramState] = useState({} as any);
  const defaultProgramState = {
    program: {},
    defaultCounter: undefined,
    leftVotes: 0,
    rightVotes: 0,
  };

  // it takes a lot of effort on the client side to setup the program connection and wallet, unlike anchor where much of the thing are done already
  const setupProgram = async () => {
    let idl = idl_type as anchor.Idl;
    const network = 'https://api.devnet.solana.com';
    const connection = new anchor.web3.Connection(network);

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      opts.preflighCommitment
    );

    const program = new anchor.Program(
      idl,
      'HWFFMkkxfV2xSpxytZQaEDP1QCYLKG71Vxt7bZ6zgFhK',
      provider
    );
    console.log('The program is: ', program);

    // Fetching the ballot box; exact same code as tests
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );
    console.log('Ballot box public key: ', ballotPDA);

    const ballotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Ballot box: ', ballotBox);

    // Finally setting the program state to the loaded program variable
    setProgramState({
      program: program,
      ballotBox: ballotBox,
      // @ts-ignore
      leftVotes: ballotBox.leftVotes.toString(),
      // @ts-ignore
      rightVotes: ballotBox.rightVotes.toString(),
    });
  };
  const checkWhitelisted = async () => {
    const program = programState.program;
    const whitelistingKey = new PublicKey(
      'GAChMFE4jNfB7XXfx6dEoPGWV7UxNRRdxois4FcmBVxe'
    ); // Put any public key that you want to check the whitelisted for.
    const [whitelistPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('whitelisting'), wallet.publicKey.toBuffer()],
      program.programId
    );
    const whitelist = await program.account.whitelist.fetch(whitelistPDA);

    console.log('Whitelist: ', whitelist);
  };

  const voteLeft = async () => {
    const systemProgram = anchor.web3.SystemProgram;
    const program = programState.program;
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );

    const originalBallotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Original left votes: ', originalBallotBox.leftVotes);
    console.log('Original balance: ', originalBallotBox.balance);

    const VoteOption = {
      leftVote: 0, // variantName : {}
    };

    await checkWhitelisted()
      .then(async () => {
        console.log("Voting can be done, you're whitelisted");
        const tx = await program.methods
          .vote(VoteOption) // enum as the parameter
          .accounts({
            ballotBox: ballotPDA,
            authority: wallet.publicKey,
            systemProgram: systemProgram.programId,
          })
          .signers([])
          .rpc();

        const updatedBallotBox = await program.account.ballotBox.fetch(
          ballotPDA
        );

        // setProgramState({ ...programState, leftVotes: updatedBallotBox.leftVotes });
        console.log('Updated left votes: ', updatedBallotBox.leftVotes);
        console.log('Updated balance: ', updatedBallotBox.balance);

        console.log('Vote transaction: ', tx);

        setProgramState({
          ...programState,
          leftVotes: updatedBallotBox.leftVotes.toString(),
        });
      })
      .catch((err) => {
        console.log("You're not whitelisted, you can't vote");
        console.log(err);
      });
  };

  // this hook sets up the program
  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }
      await setupProgram();
      console.log('Program setup');
    })();
  }, [wallet]);

  // this hook logs when program setup gets done
  useEffect(() => {
    // @ts-ignore
    if (!programState.program) {
      // console.log('programState.program: ', programState);
      return;
    }
    console.log('Program setup has been done.');
  }, [programState]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Votesol</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="px-10">
        <div className="mockup-window border bg-base-300">
          <div className="flex justify-center px-4 py-16 bg-base-200">
            <WalletMultiButton />
            <WalletDisconnectButton />
            {programState.program && (
              <div>
                {' '}
                <div>Votes: {programState.leftVotes}</div>
                <button
                  onClick={async () => {
                    // console.log(programState);
                    await voteLeft();
                    await setupProgram();
                  }}
                >
                  Vote for left
                </button>{' '}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
