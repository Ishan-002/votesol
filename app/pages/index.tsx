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
import { ConfirmOptions } from '@solana/web3.js';

const Home: NextPage = () => {
  const connection = useConnection();
  const wallet: AnchorWallet | any = useAnchorWallet();
  // the options for the provider constructor
  const opts = { preflighCommitment: 'processed' as ConfirmOptions };
  const [programState, setProgramState] = useState({});

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

    // Finally setting the program state to the loaded program variable
    setProgramState(program);

    // Fetching the ballot box; exact same code as tests
    const [ballotPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('ballot_box')],
      program.programId
    );
    console.log('Ballot box public key: ', ballotPDA);

    const ballotBox = await program.account.ballotBox.fetch(ballotPDA);
    console.log('Ballot box: ', ballotBox);
  };
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
    })();
  }, [wallet]);
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
