import React from 'react';

const Header = ({ pubKey, balance }) => {
  return (
    <div className="bg-gray-800 h-20 flex justify-between items-center px-10 border-b border-gray-700">
      <div className="text-3xl font-bold text-purple-400">Stellar dApp</div>

      <div className="flex items-center gap-4">
        {pubKey && (
          <>
            <div className="p-2 bg-gray-900 border border-emerald-500 rounded-md text-emerald-400 font-medium text-sm">
              🟢 {`${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`}
            </div>

            <div className="p-2 bg-gray-900 border border-emerald-500 rounded-md text-emerald-400 font-medium text-sm">
              Balance: {balance} XLM
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;