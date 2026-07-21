import './App.css';
import Header from './components/Header';
import Landing from './components/Landing';
import WalletModal from './components/WalletModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import PaymentPanel from './components/PaymentPanel';
import FeedbackPanel from './components/FeedbackPanel';
import { useState, useEffect, createContext } from 'react';
import {
  Horizon,
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  BASE_FEE,
  TimeoutInfinite,
  Contract,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { checkConnection, retrievePublicKey, getBalance } from './components/Freighter';
import { LayoutDashboard, Send, MessageSquareText, CheckCircle2, AlertCircle, X } from 'lucide-react';

const pubKeyData = createContext();
const server = new Horizon.Server('https://horizon-testnet.stellar.org');

const CONTRACT_ID = 'CC3I5V57TQDFKK3CFIOHC3RYXHRG4WPRLHFZC6VHRZEFRRWM4XWHWOGC';
const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: Send },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
];

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [activeTab, setActiveTab] = useState('analytics');
  const [notice, setNotice] = useState('');

  const [pubKey, _setPubKey] = useState('');
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Feedback States
  const [feedbackInput, setFeedbackInput] = useState('');
  const [userName, setUserName] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedTxIndex, setCopiedTxIndex] = useState(null);

  // Search States
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (pubKey) {
      fetchTransactionHistory(pubKey);
    } else {
      setBalance('0');
      setTransactions([]);
    }
    setTxHash('');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  useEffect(() => {
    handleFetchAllFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  const handleConnectFreighter = async () => {
    setConnecting(true);
    try {
      const allowed = await checkConnection();
      if (!allowed) {
        setError('Permission denied by wallet.');
        return;
      }

      const key = await retrievePublicKey();
      const bal = await getBalance();

      _setPubKey(key);
      setBalance(Number(bal).toFixed(2));
      setIsModalOpen(false);
      setView('dashboard');
    } catch (e) {
      console.error(e);
      setError('Wallet connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const name = provider === 'telegram' ? 'Telegram' : 'X';
    setNotice(`${name} sign-in is coming soon. Meanwhile, connect a wallet for full access.`);
    setView('dashboard');
  };

  const fetchBalanceAfterTx = async (address) => {
    try {
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
      setBalance(nativeBalance ? Number(nativeBalance.balance).toFixed(2) : '0');
    } catch (err) {
      setBalance('Account Not Funded');
    }
  };

  const fetchTransactionHistory = async (address) => {
    if (!address) return;
    try {
      const txRecords = await server.transactions().forAccount(address).order('desc').limit(5).call();
      setTransactions(txRecords.records);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = () => {
    _setPubKey('');
    setBalance('0');
    setTransactions([]);
    setError('');
    setTxHash('');
    setView('landing');
  };

  const simulateContractCall = async (methodName, params = []) => {
    const contract = new Contract(CONTRACT_ID);
    const activePubKey = pubKey || 'GB7U7DTUDKXTNZFUT3Q7XWEXL7G4LXN5VNECEIWDXU6LMLD7KXTND7TU';
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

  const handleFetchAllFeedbacks = async () => {
    try {
      const totalFeedbacks = await simulateContractCall('get_total_feedbacks');
      if (!totalFeedbacks || totalFeedbacks === 0) {
        setFeedbacks([]);
        return;
      }

      const allFeedbacks = [];
      for (let i = 1; i <= totalFeedbacks; i++) {
        const item = await simulateContractCall('get_feedback_by_id', [xdr.ScVal.scvU32(i)]);
        if (item) {
          allFeedbacks.push(item);
        }
      }
      setFeedbacks(allFeedbacks.reverse());
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!pubKey) {
      setError('Missing Key: Please connect your wallet first.');
      return;
    }
    if (!feedbackInput || !userName) return;

    setContractLoading(true);
    setError('');
    setTxHash('');

    try {
      const contract = new Contract(CONTRACT_ID);
      const account = await server.loadAccount(pubKey);

      const params = [xdr.ScVal.scvString(userName), xdr.ScVal.scvString(feedbackInput)];

      const baseTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(contract.call('send_feedback', ...params))
        .setTimeout(TimeoutInfinite)
        .build();

      const preparedTx = await sorobanRpc.prepareTransaction(baseTx);
      const xdrString = preparedTx.toXDR();

      let signedResult;
      try {
        signedResult = await signTransaction(xdrString, { network: 'TESTNET', networkPassphrase });
      } catch (walletError) {
        setError('UserReject: Transaction signing was canceled by the user.');
        setContractLoading(false);
        return;
      }

      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const sendTxResult = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(finalXdr, networkPassphrase));

      if (sendTxResult.status !== 'ERROR') {
        setTxHash(sendTxResult.hash);
        setFeedbackInput('');
        setTimeout(() => {
          handleFetchAllFeedbacks();
          fetchTransactionHistory(pubKey);
          fetchBalanceAfterTx(pubKey);
        }, 5000);
      } else {
        setError(`Soroban RPC Error: ${JSON.stringify(sendTxResult)}`);
      }
    } catch (err) {
      setError('UserReject: Transaction error or signing canceled.');
    } finally {
      setContractLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTxHash('');
    try {
      const account = await server.loadAccount(pubKey);
      const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount: amount }))
        .setTimeout(TimeoutInfinite)
        .build();

      const xdrString = transaction.toXDR();
      let signedResult;
      try {
        signedResult = await signTransaction(xdrString, { network: 'TESTNET', networkPassphrase: Networks.TESTNET });
      } catch (err) {
        setError('UserReject: Transaction signing was canceled.');
        setLoading(false);
        return;
      }
      const finalXdr = typeof signedResult === 'string' ? signedResult : (signedResult.signedTxXdr || signedResult);
      const txResponse = await server.submitTransaction(TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET));
      setTxHash(txResponse.hash);
      fetchBalanceAfterTx(pubKey);
      fetchTransactionHistory(pubKey);
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError('UserReject: Transaction canceled.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchId = async (e) => {
    e.preventDefault();
    if (!searchId) return;

    setSearchLoading(true);
    setSearchResult(null);
    setError('');

    try {
      const parsedId = parseInt(searchId, 10);
      if (isNaN(parsedId)) {
        setError('Please enter a valid numeric ID.');
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
      setError('Failed to query the smart contract storage.');
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

  if (view === 'landing') {
    return (
      <>
        <Landing
          onWalletConnect={() => setIsModalOpen(true)}
          onSocialLogin={handleSocialLogin}
        />
        <WalletModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnectFreighter={handleConnectFreighter}
          connecting={connecting}
        />
        {error && (
          <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-destructive/50 bg-card p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 font-sans text-foreground">
      <Header
        pubKey={pubKey}
        balance={balance}
        onConnect={() => setIsModalOpen(true)}
        onDisconnect={handleDisconnect}
      />

      <pubKeyData.Provider value={pubKey}>
        <main className="mx-auto max-w-6xl px-6 pt-8">
          {/* Page heading + tabs */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Live data from Horizon and the Soroban feedback contract
              </p>
            </div>
            <nav aria-label="Dashboard sections" className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={15} aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Notice banner */}
          {notice && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-primary" aria-hidden="true" />
                {notice}
              </span>
              <button onClick={() => setNotice('')} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Success / error notifications */}
          {txHash && (
            <div className="mt-6 flex items-start gap-2 break-all rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                Transaction successful. Hash: <span className="font-mono text-xs">{txHash}</span>
              </span>
            </div>
          )}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab content */}
          <div className="mt-8">
            {activeTab === 'analytics' && (
              <AnalyticsPanel
                transactions={transactions}
                feedbacks={feedbacks}
                balance={balance}
                pubKey={pubKey}
              />
            )}
            {activeTab === 'payments' && (
              <div className="mx-auto max-w-xl">
                <PaymentPanel
                  pubKey={pubKey}
                  balance={balance}
                  recipient={recipient}
                  setRecipient={setRecipient}
                  amount={amount}
                  setAmount={setAmount}
                  loading={loading}
                  onPay={handlePayment}
                  onConnect={() => setIsModalOpen(true)}
                  transactions={transactions}
                  onCopyTxHash={handleCopyTxHash}
                  copiedTxIndex={copiedTxIndex}
                />
              </div>
            )}
            {activeTab === 'feedback' && (
              <div className="mx-auto max-w-xl">
                <FeedbackPanel
                  pubKey={pubKey}
                  userName={userName}
                  setUserName={setUserName}
                  feedbackInput={feedbackInput}
                  setFeedbackInput={setFeedbackInput}
                  contractLoading={contractLoading}
                  onSendFeedback={handleSendFeedback}
                  feedbacks={feedbacks}
                  onCopyText={handleCopyText}
                  copiedIndex={copiedIndex}
                  searchId={searchId}
                  setSearchId={setSearchId}
                  onSearchId={handleSearchId}
                  searchLoading={searchLoading}
                  searchResult={searchResult}
                />
              </div>
            )}
          </div>
        </main>
      </pubKeyData.Provider>

      <WalletModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectFreighter={handleConnectFreighter}
        connecting={connecting}
      />
    </div>
  );
}

export default App;
