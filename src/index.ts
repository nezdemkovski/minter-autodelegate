import { NowRequest, NowResponse } from "@now/node";
const { Minter, DelegateTxParams } = require("minter-js-sdk");
import fetch from "isomorphic-unfetch";
// const { walletFromMnemonic } = require("minterjs-wallet");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const VALIDATOR_PUBLIC_KEY = process.env.VALIDATOR_PUBLIC_KEY || "";
const MAINNET_URL = process.env.MAINNET_URL || "";
const AMOUNT_TO_DELEGATE = 10;
const MY_PUBLIC_KEY = process.env.MY_PUBLIC_KEY || "";

interface AccountInfo {
  data: {
    address: string;
    balances: Array<{
      coin: string;
      amount: string;
    }>;
  };
}

const minterSDK = new Minter({
  apiType: "gate",
  baseURL: MAINNET_URL
});

const txParams = new DelegateTxParams({
  privateKey: PRIVATE_KEY,
  chainId: 1,
  publicKey: VALIDATOR_PUBLIC_KEY,
  coinSymbol: "BIP",
  stake: AMOUNT_TO_DELEGATE || 1,
  feeCoinSymbol: "BIP"
});

// const getPrivateKey = (mnemonic: string) => {
//   const wallet = walletFromMnemonic(mnemonic);
//   console.log({ wallet: wallet.getPrivateKeyString() });
// };

const getBIPBalance = async (): Promise<string> => {
  const getBalance = await fetch(
    `https://explorer-api.apps.minter.network/api/v1/addresses/${MY_PUBLIC_KEY}`
  )
    .then(r => r.json())
    .then((data: AccountInfo) => {
      const foundedBIP = data.data.balances.find(
        (element: { coin: string; amount: string }) => element.coin === "BIP"
      );

      if (foundedBIP) {
        return foundedBIP.amount;
      }

      return "0";
    });

  return getBalance;
};

export default async (_req: NowRequest, res: NowResponse) => {
  const balance = await getBIPBalance();

  if (Math.floor(parseFloat(balance)) >= AMOUNT_TO_DELEGATE + 1) {
    try {
      const response = await minterSDK.postTx(txParams, { gasRetryLimit: 2 });
      return res
        .status(200)
        .send(
          `Succesfully delegated. Transaction: https://explorer.minter.network/transactions/${response}`
        );
    } catch (error) {
      return res.status(500).send(`Something bad happened: ${error}`);
    }
  }

  res
    .status(200)
    .send(`Not enough BIP to delegate! Current amount: ${balance}`);
};
