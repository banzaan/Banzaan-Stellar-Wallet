import {
  signTransaction,
  setAllowed,
  getAddress,
  requestAccess,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org",
);

const checkConnection = async () => {
  return await setAllowed();
};

const getRequestAccess = async () => {
  return await requestAccess();
};

const retrievePublicKey = async () => {
  const { address } = await getAddress();
  return address;
};

const getBalance = async () => {
  await setAllowed();
  const { address } = await getAddress();
  const account = await server.loadAccount(address);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  return xlm?.balance || "0";
};

const userSignTransaction = async (xdr) => {
  return await signTransaction(xdr, {
    network: "TESTNET"
  });
};

export {
  checkConnection,
  retrievePublicKey,
  getBalance,
  userSignTransaction,
  getRequestAccess,
};