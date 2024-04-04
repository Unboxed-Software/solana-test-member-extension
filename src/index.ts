import { initializeKeypair } from "@solana-developers/helpers";
import {
  Cluster,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import dotenv from "dotenv";
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  createInitializeGroupInstruction,
  createInitializeGroupPointerInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
} from "@solana/spl-token";
import { createInitializeInstruction, createUpdateFieldInstruction, pack, TokenMetadata } from "@solana/spl-token-metadata";
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

  const metadata: TokenMetadata = {
	  mint: mintKeypair.publicKey,
	  name: "Test Group",
	  symbol: "GRP",
	  uri: "",
	  additionalMetadata: []
  };

  //   const extensions: any[] = [ExtensionType.GroupPointer];
  const extensions: any[] = [
    ExtensionType.GroupPointer,
    ExtensionType.MetadataPointer,
  ];
  //   const extensions: any[] = [ExtensionType.GroupPointer, ExtensionType.TokenGroup];
  //   const extensions: any[] = [ExtensionType.TokenGroup, ExtensionType.GroupPointer];
  //   const extensions: ExtensionType[] = [];

  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const mintLength = getMintLen(extensions);
  const totalLen = mintLength + metadataLen;

  const mintLamports =
    await connection.getMinimumBalanceForRentExemption(totalLen);

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
      mintKeypair.publicKey
    ),
	createInitializeMetadataPointerInstruction(
		mintKeypair.publicKey,
		updateAuthority.publicKey,
		mintKeypair.publicKey,
		TOKEN_2022_PROGRAM_ID
	),
    createInitializeMintInstruction(
      mint,
      decimals,
      mintAuthority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    ),
	createInitializeGroupInstruction({
		group: mintKeypair.publicKey,
		maxSize: maxMembers,
		mint: mintKeypair.publicKey,
		mintAuthority: mintAuthority.publicKey,
		programId: TOKEN_2022_PROGRAM_ID,
		updateAuthority: updateAuthority.publicKey,
	  }),
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
