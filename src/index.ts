import { initializeKeypair } from "@solana-developers/helpers";
import { Cluster, Connection, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";
import {
	ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeGroupInstruction,
  createInitializeGroupPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
} from "@solana/spl-token";
dotenv.config();

const CLUSTER: Cluster = "devnet";

async function main() {
  /**
   * Create a connection and initialize a keypair if one doesn't already exists.
   * If a keypair exists, airdrop a sol if needed.
   */
  const connection = new Connection("http://127.0.0.1:8899");
  const payer = await initializeKeypair(connection);

  const mintAuthority = payer;
  const freezeAuthority = payer;
  const updateAuthority = payer;

  const decimals = 0;
  const mintKeypair = Keypair.generate();
  let mint = mintKeypair.publicKey;
  console.log(
    "\nmint public key: " + mintKeypair.publicKey.toBase58() + "\n\n"
  );

  const maxMembers = 1;

  const extensions: any[] = [ExtensionType.GroupPointer];
//   const extensions: any[] = [ExtensionType.GroupPointer, ExtensionType.TokenGroup];
//   const extensions: any[] = [ExtensionType.TokenGroup, ExtensionType.GroupPointer];
//   const extensions: ExtensionType[] = [];
  const mintLength = getMintLen(extensions);

  const mintLamports =
    await connection.getMinimumBalanceForRentExemption(mintLength);

  console.log("Creating a transaction with group instruction... ");

  const mintTransaction = new Transaction().add(
	SystemProgram.createAccount({
		fromPubkey: payer.publicKey,
		newAccountPubkey: mint,
		space: mintLength,
		lamports: mintLamports,
		programId: TOKEN_2022_PROGRAM_ID,
	}),
	createInitializeGroupPointerInstruction(
		mintKeypair.publicKey,
		updateAuthority.publicKey,
		mintKeypair.publicKey,
	),
	createInitializeGroupInstruction({
		group: mintKeypair.publicKey,
		maxSize: maxMembers,
		mint: mintKeypair.publicKey,
		mintAuthority: mintAuthority.publicKey,
		programId: TOKEN_2022_PROGRAM_ID,
		updateAuthority: updateAuthority.publicKey,
	}),
	createInitializeMintInstruction(mint, decimals, mintAuthority.publicKey, null, TOKEN_2022_PROGRAM_ID),
  );

  console.log("Sending create mint transaction...");
  let signature = await sendAndConfirmTransaction(
    connection,
    mintTransaction,
    [payer, mintKeypair],
    { commitment: "finalized" }
  );

  console.log(
	`Check the transaction at: https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`
  );
}

main();
