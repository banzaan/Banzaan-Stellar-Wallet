import React, { useState } from "react";
import {
  checkConnection,
  retrievePublicKey,
  getBalance,
} from "./Freighter";

const Header = ({ pubKey, setPubKey }) => {
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState("0");

  const connectWallet = async () => {
    try {
      const allowed = await checkConnection();

      if (!allowed) return alert("Permission denied");

      const key = await retrievePublicKey();
      const bal = await getBalance();

      setPubKey(key);
      setBalance(Number(bal).toFixed(2));
      setConnected(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gray-300 h-20 flex justify-between items-center px-10">
      <div className="text-3xl font-bold">Stellar dApp</div>

      <div className="flex items-center gap-4">
        {pubKey && (
          <>
            <div className="p-2 bg-gray-50 border rounded-md">
              {`${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`}
            </div>

            <div className="p-2 bg-gray-50 border rounded-md">
              Balance: {balance} XLM
            </div>
          </>
        )}

        <button
          onClick={connectWallet}
          disabled={connected}
          className={`text-xl w-52 rounded-md p-4 font-bold text-white ${
            connected
              ? "bg-green-500 cursor-not-allowed"
              : "bg-blue-400 hover:bg-blue-500"
          }`}
        >
          {connected ? "Connected" : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
};

export default Header;
