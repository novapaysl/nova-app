import React, { useState } from 'react';

export default function NovaPayHub() {
  // 1. Temporary Mock Balances to test states visually
  const [balances, setBalances] = useState({
    SLE: 5000.00,
    USD: 150.00
  });
  const myWalletNumber = "232899149";

  // 2. Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'send' | 'receive' | 'convert'>('dashboard');

  // 3. Send Money States
  const [sendType, setSendType] = useState<'novapay' | 'momo'>('novapay'); // NovaPay or Mobile Money
  const [sendSource, setSendSource] = useState<'SLE' | 'USD'>('SLE');     // SLE or USD wallet
  const [sendRecipient, setSendRecipient] = useState('');                 // Phone number or Wallet ID
  const [sendAmount, setSendAmount] = useState('');
  const [momoOperator, setMomoOperator] = useState('orange');

  // 4. Receive Money States
  const [receiveWallet, setReceiveWallet] = useState<'SLE' | 'USD'>('SLE');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [secureLink, setSecureLink] = useState('');

  // 5. Currency Converter States
  const [swapFrom, setSwapFrom] = useState<'SLE' | 'USD'>('SLE');
  const [swapAmount, setSwapAmount] = useState('');
  const EXCHANGE_RATE = 22.50; // Example Rate: 1 USD = 22.50 SLE

  // ==========================================
  // CLICK HANDLERS (Saves/Deducts visual state)
  // ==========================================

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(sendAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    // Enforce logic rule: Can't send USD straight to Mobile Money!
    if (sendType === 'momo' && sendSource === 'USD') {
      alert("❌ Mobile Money transfers in Sierra Leone must be sent from your SLE Wallet. Please swap your USD to SLE first!");
      return;
    }

    if (sendSource === 'SLE') {
      if (balances.SLE < amt) return alert("❌ Insufficient SLE Balance!");
      setBalances(prev => ({ ...prev, SLE: prev.SLE - amt }));
    } else {
      if (balances.USD < amt) return alert("❌ Insufficient USD Balance!");
      setBalances(prev => ({ ...prev, USD: prev.USD - amt }));
    }

    alert(`🎉 Success! Transferred ${amt} ${sendSource} to ${sendType === 'novapay' ? `NovaPay Wallet ${sendRecipient}` : `Mobile Money (${momoOperator.toUpperCase()}) ${sendRecipient}`}`);
    setSendAmount('');
    setSendRecipient('');
  };

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receiveAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    // Secure Link format passing target wallet (SLE/USD) and requested amount
    const link = `https://novapaysl.github.io/nova-app/#/checkout?to=${myWalletNumber}&amount=${amt}&currency=${receiveWallet}`;
    setSecureLink(link);
  };

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(swapAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    if (swapFrom === 'SLE') {
      if (balances.SLE < amt) return alert("❌ Insufficient SLE Balance!");
      const receivedUSD = amt / EXCHANGE_RATE;
      setBalances({
        SLE: balances.SLE - amt,
        USD: balances.USD + receivedUSD
      });
      alert(`🔄 Successfully swapped ${amt} SLE for $${receivedUSD.toFixed(2)} USD!`);
    } else {
      if (balances.USD < amt) return alert("❌ Insufficient USD Balance!");
      const receivedSLE = amt * EXCHANGE_RATE;
      setBalances({
        SLE: balances.SLE + receivedSLE,
        USD: balances.USD - amt
      });
      alert(`🔄 Successfully swapped $${amt} USD for ${receivedSLE.toFixed(2)} SLE!`);
    }
    setSwapAmount('');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0e1726', minHeight: '100vh', color: '#fff', display: 'flex' }}>
      
      {/* 1. SIDEBAR */}
      <div style={{ width: '250px', background: '#1c2237', borderRight: '1px solid #2e354f', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h2 style={{ color: '#00c3ff', marginBottom: '40px' }}>NovaPay Hub</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('send')} style={navBtnStyle(activeTab === 'send')}>📤 Send Money</button>
          <button onClick={() => setActiveTab('receive')} style={navBtnStyle(activeTab === 'receive')}>📩 Receive Money</button>
          <button onClick={() => setActiveTab('convert')} style={navBtnStyle(activeTab === 'convert')}>🔄 Wallet Swap</button>
        </div>
      </div>

      {/* 2. MAIN HUB WORKSPACE */}
      <div style={{ flex: 1, padding: '40px' }}>
        
        {/* ========================================== */}
        {/* TAB: DASHBOARD */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <div>
            <h3>My Multicurrency Accounts</h3>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              
              {/* SLE Card */}
              <div style={walletCardStyle('linear-gradient(135deg, #0284c7, #0369a1)')}>
                <p style={{ margin: 0, opacity: 0.8 }}>Sierra Leonean Leone Wallet</p>
                <h2 style={{ fontSize: '32px', margin: '15px 0' }}>SLE {balances.SLE.toLocaleString()}</h2>
                <span style={pillStyle}>Vult Card • Mobile Money</span>
              </div>

              {/* USD Card */}
              <div style={walletCardStyle('linear-gradient(135deg, #10b981, #047857)')}>
                <p style={{ margin: 0, opacity: 0.8 }}>United States Dollar Wallet</p>
                <h2 style={{ fontSize: '32px', margin: '15px 0' }}>${balances.USD.toLocaleString()}</h2>
                <span style={pillStyle}>Vult Card • P2P Transfer</span>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: SEND MONEY (INTEGRATED ROUTER) */}
        {/* ========================================== */}
        {activeTab === 'send' && (
          <div style={formWrapperStyle}>
            <h3>Send Money</h3>
            <p style={{ color: '#8c98a9', fontSize: '13px', marginTop: '-10px' }}>Transfer money instantly from your choose wallet.</p>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Selector A: NovaPay to NovaPay OR Mobile Money? */}
              <label style={labelStyle}>Transfer Destination Network</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setSendType('novapay')} style={toggleBtnStyle(sendType === 'novapay')}>🔄 NovaPay to NovaPay</button>
                <button type="button" onClick={() => setSendType('momo')} style={toggleBtnStyle(sendType === 'momo')}>📱 Mobile Money Account</button>
              </div>

              {/* Selector B: Choose Debit Wallet Source (Hides USD for Mobile Money automatically) */}
              <label style={labelStyle}>Debit From Wallet</label>
              <select value={sendSource} onChange={(e) => setSendSource(e.target.value as 'SLE' | 'USD')} style={inputStyle}>
                <option value="SLE">SLE Wallet (Balance: SLE {balances.SLE.toFixed(2)})</option>
                {sendType === 'novapay' && (
                  <option value="USD">USD Wallet (Balance: ${balances.USD.toFixed(2)})</option>
                )}
              </select>

              {/* Network Specific Fields */}
              {sendType === 'novapay' ? (
                <>
                  <label style={labelStyle}>Recipient NovaPay Wallet ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 232999111" 
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    style={inputStyle} 
                    required 
                  />
                </>
              ) : (
                <>
                  <label style={labelStyle}>Network Operator</label>
                  <select value={momoOperator} onChange={(e) => setMomoOperator(e.target.value)} style={inputStyle}>
                    <option value="orange">Orange Money</option>
                    <option value="mtn">MTN MoMo</option>
                    <option value="africell">Africell Money</option>
                  </select>

                  <label style={labelStyle}>Recipient Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 076123456" 
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    style={inputStyle} 
                    required 
                  />
                </>
              )}

              <label style={labelStyle}>Amount to Send</label>
              <input 
                type="number" 
                step="any"
                placeholder="0.00" 
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                style={inputStyle} 
                required 
              />

              <button type="submit" style={primaryBtnStyle}>Send Funds Now ↗</button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: RECEIVE MONEY & SECURE LINK GENERATOR */}
        {/* ========================================== */}
        {activeTab === 'receive' && (
          <div style={formWrapperStyle}>
            <h3>Receive Money</h3>
            <p style={{ color: '#8c98a9', fontSize: '13px', marginTop: '-10px' }}>Input an amount to generate a shareable checkout link.</p>

            <form onSubmit={handleGenerateLink} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={labelStyle}>Select Target Wallet</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setReceiveWallet('SLE')} style={toggleBtnStyle(receiveWallet === 'SLE')}>🇸🇱 SLE Wallet</button>
                <button type="button" onClick={() => setReceiveWallet('USD')} style={toggleBtnStyle(receiveWallet === 'USD')}>💵 USD Wallet</button>
              </div>

              <label style={labelStyle}>Amount Requested</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={receiveAmount}
                onChange={(e) => setReceiveAmount(e.target.value)}
                style={inputStyle} 
                required 
              />

              <button type="submit" style={primaryBtnStyle}>Generate Secure Checkout Link</button>
            </form>

            {secureLink && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#111827', border: '1px dashed #00c3ff', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#00c3ff', fontWeight: 'bold', fontSize: '13px' }}>🔗 Secure Link Ready to Share:</p>
                <input type="text" readOnly value={secureLink} style={{ ...inputStyle, background: '#0e1726', color: '#8c98a9', fontSize: '11px' }} />
                <button 
                  onClick={() => { navigator.clipboard.writeText(secureLink); alert("Copied to clipboard!"); }} 
                  style={{ marginTop: '10px', padding: '8px', background: 'transparent', border: '1px solid #00c3ff', color: '#00c3ff', width: '100%', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Copy Link 📋
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: WALLET CONVERTER */}
        {/* ========================================== */}
        {activeTab === 'convert' && (
          <div style={formWrapperStyle}>
            <h3>Exchange Currencies Instantly</h3>
            <p style={{ color: '#8c98a9', fontSize: '13px', marginTop: '-10px' }}>Swap funds instantly between your local SLE and USD accounts.</p>

            <div style={{ background: '#111827', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8c98a9' }}>Exchange Rate:</span>
              <strong style={{ color: '#00c3ff' }}>1 USD = {EXCHANGE_RATE} SLE</strong>
            </div>

            <form onSubmit={handleSwap} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={labelStyle}>Swap Direction</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setSwapFrom('SLE')} style={toggleBtnStyle(swapFrom === 'SLE')}>🇸🇱 SLE ➔ 💵 USD</button>
                <button type="button" onClick={() => setSwapFrom('USD')} style={toggleBtnStyle(swapFrom === 'USD')}>💵 USD ➔ 🇸🇱 SLE</button>
              </div>

              <label style={labelStyle}>Amount to Exchange</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                style={inputStyle} 
                required 
              />

              {swapAmount && (
                <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Will Receive:</strong> {swapFrom === 'SLE' ? `$${(parseFloat(swapAmount) / EXCHANGE_RATE).toFixed(2)} USD` : `${(parseFloat(swapAmount) * EXCHANGE_RATE).toFixed(2)} SLE`}
                </div>
              )}

              <button type="submit" style={primaryBtnStyle}>Swap Balance Instantly 🔄</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

// Styling objects
const navBtnStyle = (active: boolean) => ({
  background: active ? '#0070f3' : 'transparent',
  border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'left' as const, cursor: 'pointer', fontSize: '14px'
});
const walletCardStyle = (bg: string) => ({
  background: bg, padding: '24px', borderRadius: '16px', flex: 1, minWidth: '240px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
});
const pillStyle = { background: 'rgba(0,0,0,0.25)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' };
const formWrapperStyle = { background: '#1c2237', padding: '30px', borderRadius: '16px', maxWidth: '480px', margin: '0 auto', border: '1px solid #2e354f' };
const labelStyle = { display: 'block', fontSize: '13px', color: '#8c98a9', marginTop: '10px' };
const inputStyle = { width: '100%', padding: '12px', background: '#111827', border: '1px solid #2e354f', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' as const, outline: 'none' };
const primaryBtnStyle = { width: '100%', padding: '14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer', marginTop: '15px' };
const toggleBtnStyle = (active: boolean) => ({ flex: 1, padding: '10px', background: active ? '#0070f3' : '#111827', border: active ? '1px solid #00c3ff' : '1px solid #2e354f', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' });