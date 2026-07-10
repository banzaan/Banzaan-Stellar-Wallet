import './App.css';
import Header from './components/Header';
import { useState, useEffect, createContext } from 'react';
import { Horizon, TransactionBuilder, Networks, Asset, Operation, BASE_FEE, TimeoutInfinite, Contract, rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { checkConnection, retrievePublicKey, getBalance } from "./components/Freighter";

const pubKeyData = createContext();
const server = new Horizon.Server("https://horizon-testnet.stellar.org");

const CONTRACT_ID = 'CC3I5V57TQDFKK3CFIOHC3RYXHRG4WPRLHFZC6VHRZEFRRWM4XWHWOGC'; 
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
  
  // Feedback States
  const [feedbackInput, setFeedbackInput] = useState("");
  const [userName, setUserName] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedTxIndex, setCopiedTxIndex] = useState(null);

  // Search States (Modified for ID Search)
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (pubKey) {
      fetchTransactionHistory(pubKey);
    } else {
      setBalance("0");
      setTransactions([]);
    }
    setTxHash("");
    setError("");
  }, [pubKey]);

  useEffect(() => {
    handleFetchAllFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  const handleConnectFreighter = async () => {
    try {
      const allowed = await checkConnection();
      if (!allowed) {
        setError("Permission denied by wallet.");
        return;
      }

      const key = await retrievePublicKey();
      const bal = await getBalance();

      _setPubKey(key);
      setBalance(Number(bal).toFixed(2));
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      setError("Wallet connection failed.");
    }
  };

  const fetchBalanceAfterTx = async (address) => {
    try {
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find(b => b.asset_type === 'native');
      setBalance(nativeBalance ? Number(nativeBalance.balance).toFixed(2) : "0");
    } catch (err) {
      setBalance("Account Not Funded"); 
    }
  };

  const fetchTransactionHistory = async (address) => {
    if (!address) return;
    try {
      const txRecords = await server.transactions().forAccount(address).order("desc").limit(5).call();
      setTransactions(txRecords.records);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = () => {
    _setPubKey("");
    setBalance("0");
    setTransactions([]);
    setError("");
    setTxHash("");
  };

  // NEW: Helper function to simulate a read-only transaction on Soroban
  const simulateContractCall = async (methodName, params = []) => {
    const contract = new Contract(CONTRACT_ID);
    const activePubKey = pubKey || "GB7U7DTUDKXTNZFUT3Q7XWEXL7G4LXN5VNECEIWDXU6LMLD7KXTND7TU";
    const account = await server.loadAccount(activePubKey);
    
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(contract.call(methodName, ...params))
      .setTimeout(TimeoutInfinite)
      .build();

    const result = await sorobanRpc.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      return scValToNative(result.result.retval);
    }
    return null;
  };

  // NEW: Fetch all feedbacks dynamically based on the current total counter
  const handleFetchAllFeedbacks = async () => {
    try {
      // 1. Get the total number of feedbacks
      const totalFeedbacks = await simulateContractCall('get_total_feedbacks');
      if (!totalFeedbacks || totalFeedbacks === 0) {
        setFeedbacks([]);
        return;
      }

      const allFeedbacks = [];
      // 2. Loop through and fetch each feedback by its ID
      for (let i = 1; i <= totalFeedbacks; i++) {
        const item = await simulateContractCall('get_feedback_by_id', [xdr.ScVal.scvU32(i)]);
        if (item) {
          allFeedbacks.push(item); // item will be an object: { id, user, message }
        }
      }
      // Show newest first
      setFeedbacks(allFeedbacks.reverse());
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!pubKey) {
      setError("Missing Key: Please connect your wallet first.");
      return;
    }
    if (!feedbackInput || !userName) return;

    setContractLoading(true);
    setError("");
    setTxHash("");
    
    try {
      const contract = new Contract(CONTRACT_ID);
      const account = await server.loadAccount(pubKey);

      const params = [
        xdr.ScVal.scvString(userName),
        xdr.ScVal.scvString(feedbackInput)
      ];

      const baseTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(contract.call('send_feedback', ...params))
        .setTimeout(TimeoutInfinite)
        .build();

      const preparedTx = await sorobanRpc.prepareTransaction(baseTx);
      const xdrString = preparedTx.toXDR();
      
      let signedResult;
      try {
        signedResult = await signTransaction(xdrString, { network: "TESTNET", networkPassphrase });
      } catch (walletError) {
        setError("UserReject: Transaction signing was canceled by the user.");
        setContractLoading(false);
        return;
      }

      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const sendTxResult = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(finalXdr, networkPassphrase));
      
      if (sendTxResult.status !== 'ERROR') {
        setTxHash(sendTxResult.hash);
        setFeedbackInput("");
        setTimeout(() => {
          handleFetchAllFeedbacks();
          fetchTransactionHistory(pubKey);
          fetchBalanceAfterTx(pubKey);
        }, 5000);
      } else {
        setError(`Soroban RPC Error: ${JSON.stringify(sendTxResult)}`);
      }
    } catch (err) {
      setError("UserReject: Transaction error or signing canceled.");
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
      const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount: amount }))
        .setTimeout(TimeoutInfinite)
        .build();

      const xdrString = transaction.toXDR();
      let signedResult;
      try {
        signedResult = await signTransaction(xdrString, { network: "TESTNET", networkPassphrase: Networks.TESTNET });
      } catch (err) {
        setError("UserReject: Transaction signing was canceled.");
        setLoading(false);
        return;
      }
      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const txResponse = await server.submitTransaction(TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET));
      setTxHash(txResponse.hash);
      fetchBalanceAfterTx(pubKey);
      fetchTransactionHistory(pubKey);
      setRecipient("");
      setAmount("");
    } catch (err) {
      setError("UserReject: Transaction canceled.");
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED: Search directly inside contract by ID instead of pulling transaction hashes
  const handleSearchId = async (e) => {
    e.preventDefault();
    if (!searchId) return;

    setSearchLoading(true);
    setSearchResult(null);
    setError("");

    try {
      const parsedId = parseInt(searchId, 10);
      if (isNaN(parsedId)) {
        setError("Please enter a valid numeric ID.");
        setSearchLoading(false);
        return;
      }

      const item = await simulateContractCall('get_feedback_by_id', [xdr.ScVal.scvU32(parsedId)]);
      
      if (item) {
        setSearchResult({ id: item.id, name: item.user, message: item.message });
      } else {
        setError(`No feedback found for ID: ${searchId}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to query the smart contract storage.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyTxHash = (hash, index) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxIndex(index);
    setTimeout(() => setCopiedTxIndex(null), 2000);
  };

  return (
    <div className="App" style={{ backgroundColor: '#111827', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      <Header pubKey={pubKey} balance={balance} />
      
      <pubKeyData.Provider value={pubKey}>
        
        {/* Simple Payment Component */}
        <div style={{ maxWidth: '500px', margin: '40px auto 20px auto', padding: '32px', backgroundColor: '#1f2937', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ color: '#a78bfa', margin: 0, fontSize: '24px' }}>Stellar Simple Payment</h2>
            {pubKey && <button onClick={handleDisconnect} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Disconnect</button>}
          </div>
          {pubKey && (
            <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>YOUR BALANCE</span>
              <strong style={{ fontSize: '24px', color: '#34d399' }}>{balance} XLM</strong>
            </div>
          )}
          {pubKey ? (
            <form onSubmit={handlePayment} style={{ textAlign: 'left' }}>
              <input type="text" placeholder="Recipient G..." value={recipient} onChange={(e) => setRecipient(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
              <input type="number" step="any" placeholder="Amount (XLM)" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '6px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Processing...' : 'Send XLM'}</button>
            </form>
          ) : (
            <button onClick={() => setIsModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#f59e0b', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>🚀 Connect Multi-Wallet options</button>
          )}
        </div>

        {/* Soroban Feedback Component */}
        <div style={{ maxWidth: '500px', margin: '20px auto', padding: '32px', backgroundColor: '#1f2937', borderRadius: '12px', textAlign: 'left' }}>
          <h2 style={{ color: '#a78bfa', marginBottom: '4px', fontSize: '24px' }}>Web3 Feedback Board</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>Submit immutable logs directly to Soroban smart contract vectors</p>

          <form onSubmit={handleSendFeedback}>
            <input type="text" placeholder="Your Name / Handle" value={userName} onChange={(e) => setUserName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', marginBottom: '10px', boxSizing: 'border-box', border: '1px solid #374151' }} />
            <textarea placeholder="Write your on-chain feedback message..." value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', border: '1px solid #374151', height: '80px', resize: 'none' }} />
            <button type="submit" disabled={contractLoading || !pubKey} style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: (!pubKey || contractLoading) ? 0.5 : 1 }}>
              {contractLoading ? 'Submitting to Ledger...' : 'Submit Feedback'}
            </button>
          </form>

          {/* On-Chain Logs */}
          <h3 style={{ color: '#a78bfa', marginTop: '24px', fontSize: '16px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>On-Chain Logs ({feedbacks.length})</h3>
          <div style={{ maxHeight: '240px', overflowY: 'auto', marginTop: '10px', paddingRight: '4px' }}>
            {feedbacks.length === 0 ? <p style={{ color: '#6b7280', fontSize: '12px' }}>No feedbacks logged yet.</p> : (
              <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                {feedbacks.map((f, i) => (
                  <li 
                    key={i} 
                    onClick={() => handleCopyText(`[ID: ${f.id}] ${f.user}: ${f.message}`, i)}
                    style={{ 
                      padding: '12px', 
                      backgroundColor: '#111827', 
                      borderRadius: '8px', 
                      marginBottom: '8px', 
                      fontSize: '13px', 
                      color: '#d1d5db',
                      border: '1px solid #1f2937',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#7c3aed';
                      e.currentTarget.style.backgroundColor = '#1f2937';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1f2937';
                      e.currentTarget.style.backgroundColor = '#111827';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                      <strong style={{ color: '#f59e0b' }}>#{f.id}</strong> {f.user}: {f.message}
                    </span>
                    <span style={{ fontSize: '11px', color: copiedIndex === i ? '#34d399' : '#9ca3af', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
                      {copiedIndex === i ? '📋 Copied!' : '🗐 Copy'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Wallet Live Transactions List */}
          {pubKey && (
            <>
              <h3 style={{ color: '#a78bfa', marginTop: '28px', fontSize: '16px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>Your Wallet Live Transactions</h3>
              <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '10px' }}>
                {transactions.length === 0 ? <p style={{ color: '#6b7280', fontSize: '12px' }}>No transactions found for this account.</p> : (
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                    {transactions.map((tx, idx) => (
                      <li key={idx} style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', marginBottom: '8px', border: '1px solid #374151', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#9ca3af' }}>
                          <span>⏱ {new Date(tx.created_at).toLocaleTimeString()}</span>
                          <span style={{ color: '#34d399', fontWeight: 'bold' }}>Fee: {tx.fee_charged} stroops</span>
                        </div>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontFamily: 'monospace', color: '#cbd5e1', wordBreak: 'break-all', marginBottom: '8px' }}>
                          {`${tx.id.slice(0, 10)}...${tx.id.slice(-10)}`}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleCopyTxHash(tx.id, idx)}
                            style={{ flex: 1, padding: '6px', backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            {copiedTxIndex === idx ? '📋 Copied Hash!' : '🗐 Copy Hash'}
                          </button>
                          <a 
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ flex: 1, padding: '6px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: '4px', textDecoration: 'none', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', display: 'block' }}
                          >
                            🔍 Open Explorer
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

        </div>

        {/* 🔍 Smart Contract ID Decoder Search Section */}
        <div style={{ maxWidth: '500px', margin: '20px auto', padding: '32px', backgroundColor: '#1f2937', borderRadius: '12px', textAlign: 'left', border: '1px solid #374151' }}>
          <h2 style={{ color: '#a78bfa', marginBottom: '4px', fontSize: '20px' }}>🔍 Inspect Feedback by ID</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>Input any numeric feedback ID below to fetch and decode the text entry stored in the contract ledger.</p>

          <form onSubmit={handleSearchId} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              placeholder="Enter Feedback ID (e.g. 1)" 
              value={searchId} 
              onChange={(e) => setSearchId(e.target.value)} 
              required 
              style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151', fontSize: '13px' }} 
            />
            <button type="submit" disabled={searchLoading} style={{ padding: '0 20px', borderRadius: '6px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {searchLoading ? 'Fetching...' : 'Search'}
            </button>
          </form>

          {searchResult && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #34d399' }}>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✓ ON-CHAIN DATA EXTRACTED</span>
              
              <div style={{ marginTop: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>Feedback ID:</span>
                <strong style={{ color: '#f59e0b', fontSize: '16px' }}>#{searchResult.id}</strong>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>User / Handle:</span>
                <strong style={{ color: '#fff', fontSize: '16px' }}>{searchResult.name}</strong>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>Feedback Content:</span>
                <div style={{ color: '#d1d5db', fontSize: '14px', backgroundColor: '#1f2937', padding: '10px', borderRadius: '6px', marginTop: '4px', borderLeft: '3px solid #7c3aed' }}>
                  {searchResult.message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Wallet Modal Component */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ backgroundColor: '#1f2937', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid #374151', textAlign: 'center' }}>
              <h3 style={{ color: '#fff', marginBottom: '4px' }}>Select a Wallet</h3>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '20px' }}>Connect with Soroban testnet parameters</p>
              <button onClick={handleConnectFreighter} style={{ width: '100%', padding: '12px', backgroundColor: '#111827', color: '#fff', border: '1px solid #4b5563', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>Freighter Wallet</button>
              <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>Close Window</button>
            </div>
          </div>
        )}

        {/* Error notification display */}
        <div style={{ maxWidth: '500px', margin: '10px auto' }}>
          {error && <div style={{ padding: '12px', backgroundColor: '#7f1d1d', borderRadius: '6px', color: '#fca5a5', fontSize: '14px', marginBottom: '10px' }}>{error}</div>}
        </div>

      </pubKeyData.Provider>
    </div>
  );
}

export default App;
export { pubKeyData };