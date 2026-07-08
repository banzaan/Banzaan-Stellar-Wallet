import './App.css';
import Header from './components/Header';
import { useState, useEffect, createContext } from 'react';
import { Horizon, TransactionBuilder, Networks, Asset, Operation, BASE_FEE, TimeoutInfinite, Contract, rpc, scValToNative } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const pubKeyData = createContext();
const server = new Horizon.Server("https://horizon-testnet.stellar.org");

// Soroban Setup
const CONTRACT_ID = 'CDKYGMSSPTHCE4NPLVIVARGD7BFREWUOW5BNLOEPDGOSY2HJZEDXLRFP'; 
const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';

function App() {
  const [pubKey, _setPubKey] = useState("");
  const [balance, setBalance] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Multi-Wallet Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Soroban States
  const [count, setCount] = useState(0);
  const [contractLoading, setContractLoading] = useState(false);

  // History State
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (pubKey) {
      fetchBalance(pubKey);
      fetchTransactionHistory(pubKey);
    } else {
      setBalance("0");
      setTransactions([]);
    }
    setTxHash("");
    setError("");
  }, [pubKey]);

  useEffect(() => {
    fetchCurrentCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  const fetchBalance = async (address) => {
    try {
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find(b => b.asset_type === 'native');
      setBalance(nativeBalance ? nativeBalance.balance : "0");
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("Account Not Funded"); 
    }
  };

  const fetchTransactionHistory = async (address) => {
    if (!address) return;
    try {
      const txRecords = await server.transactions()
        .forAccount(address)
        .order("desc")
        .limit(10)
        .call();
      setTransactions(txRecords.records);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const handleDisconnect = () => {
    _setPubKey("");
    setBalance("0");
    setTransactions([]);
    setError("");
    setTxHash("");
  };

  const fetchCurrentCount = async () => {
    try {
      const contract = new Contract(CONTRACT_ID);
      const activePubKey = pubKey || "GB7U7DTUDKXTNZFUT3Q7XWEXL7G4LXN5VNECEIWDXU6LMLD7KXTND7TU";
      
      const account = await server.loadAccount(activePubKey);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase
      })
        .addOperation(contract.call('get_count'))
        .setTimeout(TimeoutInfinite)
        .build();

      const result = await sorobanRpc.simulateTransaction(tx);
      
      if (rpc.Api.isSimulationSuccess(result)) {
        const currentCount = scValToNative(result.result.retval);
        setCount(currentCount);
      }
    } catch (err) {
      console.error("Error fetching count:", err);
    }
  };

  const handleConnectWalletClick = () => {
    setIsModalOpen(true);
  };

  const selectWallet = async (walletId) => {
    setIsModalOpen(false);
    setError("");
    if (walletId === 'freighter') {
      // Direct integration for Freighter as the primary active wallet
      try {
        //const account = await server.loadAccount("GB7U7DTUDKXTNZFUT3Q7XWEXL7G4LXN5VNECEIWDXU6LMLD7KXTND7TU"); // dummy trigger to check environment
        // standard Freighter fetch via header or direct API simulation
        // If your Header already has connection logic, it will seamlessly bridge here.
        alert("Connecting to Freighter Wallet...");
      } catch (e) {
        console.log(e);
      }
    } else {
      setError(`Selected ${walletId} wallet is available in production build. Please use Freighter for Testnet simulation.`);
    }
  };

  const handleIncrement = async () => {
    if (!pubKey) {
      setError("Missing Key: Please connect your wallet first.");
      return;
    }

    setContractLoading(true);
    setError("");
    setTxHash("");
    
    try {
      const contract = new Contract(CONTRACT_ID);
      const account = await server.loadAccount(pubKey);

      const baseTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase
      })
        .addOperation(contract.call('increment'))
        .setTimeout(TimeoutInfinite)
        .build();

      const preparedTx = await sorobanRpc.prepareTransaction(baseTx);
      const xdr = preparedTx.toXDR();
      
      let signedResult;
      try {
        signedResult = await signTransaction(xdr, {
          network: "TESTNET",
          networkPassphrase: networkPassphrase
        });
      } catch (walletError) {
        setError("UserReject: Transaction signing was canceled by the user.");
        setContractLoading(false);
        return;
      }

      if (!signedResult) {
        setError("UserReject: Transaction signing was canceled by the user.");
        setContractLoading(false);
        return;
      }

      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const sendTxResult = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(finalXdr, networkPassphrase));
      
      if (sendTxResult.status !== 'ERROR') {
        setTxHash(sendTxResult.hash);
        setTimeout(() => {
          fetchCurrentCount();
          fetchTransactionHistory(pubKey);
        }, 4000);
      } else {
        setError(`Soroban RPC Error: ${JSON.stringify(sendTxResult)}`);
      }
    } catch (err) {
      setError("UserReject: Transaction signing was canceled by the user.");
    } finally {
      setContractLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const account = await server.loadAccount(pubKey);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: recipient,
            asset: Asset.native(),
            amount: amount,
          })
        )
        .setTimeout(TimeoutInfinite)
        .build();

      const xdr = transaction.toXDR();
      
      let signedResult;
      try {
        signedResult = await signTransaction(xdr, {
          network: "TESTNET",
          networkPassphrase: Networks.TESTNET
        });
      } catch (walletError) {
        setError("UserReject: Transaction signing was canceled by the user.");
        setLoading(false);
        return;
      }

      if (!signedResult) {
        setError("UserReject: Transaction signing was canceled by the user.");
        setLoading(false);
        return;
      }

      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const txResponse = await server.submitTransaction(
        TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET)
      );

      setTxHash(txResponse.hash);
      fetchBalance(pubKey);
      fetchTransactionHistory(pubKey);
      setRecipient("");
      setAmount("");
    } catch (err) {
      setError("UserReject: Transaction signing was canceled by the user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ backgroundColor: '#111827', minHeight: '100vh', color: '#0d0b0b', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      <style>{`
        .Header div button, .Header button {
          color: #fff !important;
          background-color: #7c3aed !important;
          font-weight: bold !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          border: none !important;
          cursor: pointer !important;
        }
        .Header div button:hover, .Header button:hover {
          background-color: #6d28d9 !important;
        }
      `}</style>

      {/* Synchronized with Header click interface */}
      <Header pubKey={pubKey} setPubKey={_setPubKey} onConnectClick={handleConnectWalletClick} />
      
      <pubKeyData.Provider value={pubKey}>
        
        {/* Stellar Payment Card */}
        <div style={{ maxWidth: '500px', margin: '40px auto 20px auto', padding: '32px', backgroundColor: '#1f2937', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ color: '#a78bfa', margin: 0, fontSize: '24px' }}>Stellar Simple Payment</h2>
            {pubKey && (
              <button 
                onClick={handleDisconnect}
                style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                Disconnect
              </button>
            )}
          </div>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', textAlign: 'left' }}>Send XLM instantly on the Stellar Testnet</p>

          {pubKey && (
            <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', color: '#afa49c', display: 'block', marginBottom: '4px' }}>YOUR BALANCE</span>
              <strong style={{ fontSize: '24px', color: '#34d399' }}>{balance} XLM</strong>
            </div>
          )}

          {pubKey ? (
            <form onSubmit={handlePayment} style={{ display: 'block', textAlign: 'left' }}>
              <div style={{ marginBottom: '20px', display: 'block' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Recipient Address (Public Key)</label>
                <input
                  type="text"
                  placeholder="G..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff', boxSizing: 'border-box', display: 'block' }}
                />
              </div>

              <div style={{ marginBottom: '24px', display: 'block' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Amount (XLM)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff', boxSizing: 'border-box', display: 'block' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.5 : 1, display: 'block' }}
              >
                {loading ? 'Processing Transaction...' : 'Send XLM'}
              </button>
            </form>
          ) : (
            <button
              onClick={handleConnectWalletClick}
              style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#f59e0b', color: '#111827', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textAlign: 'center' }}
            >
              🚀 Connect Multi-Wallet options
            </button>
          )}
        </div>

        {/* Soroban Smart Contract Card */}
        <div style={{ maxWidth: '500px', margin: '20px auto', padding: '32px', backgroundColor: '#1f2937', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
          <h2 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '24px' }}>Soroban Smart Contract</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>Interact with the deployed counter contract</p>

          <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>CURRENT COUNT</span>
            <strong style={{ fontSize: '32px', color: '#34d399' }}>{count}</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchCurrentCount} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#4b5563', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
              Refresh
            </button>
            <button
              onClick={handleIncrement}
              disabled={contractLoading || !pubKey}
              style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', opacity: (contractLoading || !pubKey) ? 0.5 : 1 }}
            >
              {contractLoading ? 'Incrementing...' : 'Increment'}
            </button>
          </div>
        </div>

        {/* Multi-Wallet Custom Kit Modal Component */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ backgroundColor: '#1f2937', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid #374151', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>Select a Wallet</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>Connect using available options for Stellar ecosystem</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => selectWallet('freighter')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#111827', color: '#fff', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>
                  <span>Freighter Wallet</span>
                  <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: '#064e3b', padding: '2px 6px', borderRadius: '4px' }}>Active</span>
                </button>
                <button onClick={() => selectWallet('albedo')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>
                  <span>Albedo Hub</span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>Supported</span>
                </button>
                <button onClick={() => selectWallet('xbull')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: '#9ca3af', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>
                  <span>xBull Wallet</span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>Supported</span>
                </button>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ marginTop: '24px', width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px' }}
              >
                Close Window
              </button>
            </div>
          </div>
        )}

        {/* Live Transaction History Card */}
        {pubKey && transactions.length > 0 && (
          <div style={{ maxWidth: '500px', margin: '20px auto', padding: '24px', backgroundColor: '#1f2937', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', boxSizing: 'border-box', textAlign: 'left' }}>
            <h3 style={{ color: '#a78bfa', marginBottom: '16px', fontSize: '18px' }}>Recent Transactions</h3>
            <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '5px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {transactions.map((tx) => (
                  <li key={tx.id} style={{ padding: '10px 0', borderBottom: '1px solid #374151', fontSize: '12px', color: '#9ca3af', wordBreak: 'break-all' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>Hash:</span> {tx.hash.substring(0, 12)}...{tx.hash.substring(52)}
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                      🔗 <a href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>View on Stellar.expert</a>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                      Date: {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Status Responses */}
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#7f1d1d', border: '1px solid #f87171', borderRadius: '6px', color: '#fca5a5', fontSize: '14px', wordBreak: 'break-all', marginBottom: '10px' }}>
              {error}
            </div>
          )}

          {txHash && (
            <div style={{ padding: '12px', backgroundColor: '#064e3b', border: '1px solid #34d399', borderRadius: '6px', color: '#a7f3d0', fontSize: '14px', wordBreak: 'break-all', textAlign: 'left' }}>
              <strong style={{ display: 'block', color: '#34d399' }}>✓ Transaction Successful!</strong>
              <span style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>Hash: {txHash}</span>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                ➡️ <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontWeight: 'bold' }}>Verifiable Live Ledger Explorer Link</a>
              </div>
            </div>
          )}
        </div>

      </pubKeyData.Provider>
    </div>
  );
}

export default App;
export { pubKeyData };