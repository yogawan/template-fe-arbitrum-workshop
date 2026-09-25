// =============================================================================
// FILE: src/App.jsx
// DESKRIPSI: Komponen Utama (Pusat Otak, State Management, & Controller dApp)
// =============================================================================
// Di arsitektur React, file ini menerapkan pola "Lifting State Up":
// Semua data penting (nama properti, harga, kuota, akun pengguna, riwayat transaksi)
// dikelola secara terpusat di sini, lalu dialirkan ke bawah menuju komponen-komponen
// anak (Navbar, PropertyCard, dll) melalui mekanisme Props.
// =============================================================================

// 1. IMPORT DEPENDENSI & KOMPONEN
// Mengimpor hook React untuk manajemen state, kelima komponen anak, dan stylesheet.
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import PropertyCard from './components/PropertyCard';
import InvestorPortfolio from './components/InvestorPortfolio';
import InvestBox from './components/InvestBox';
import TransactionHistory from './components/TransactionHistory';
import {
  PROPERTY_CONTRACT_ADDRESS,
  FRACTIONAL_PROPERTY_ABI,
  ARBITRUM_SEPOLIA_HEX_ID,
  ARBITRUM_SEPOLIA_NETWORK_PARAMS
} from './constants/contract';
import './App.css';

export default function App() {
  // ---------------------------------------------------------------------------
  // 2. DEKLARASI STATE METADATA PROPERTI (ASET RWA)
  // ---------------------------------------------------------------------------
  // Catatan Edukasi: Nilai awal sengaja diisi dengan data default (Mock Data)
  // agar saat aplikasi pertama kali dijalankan di `localhost:5173`, tampilan dashboard
  // langsung rapi, estetik, dan siap dipresentasikan.
  // Saat integrasi on-chain diaktifkan, nilai-nilai ini akan otomatis ditimpa
  // oleh data riil yang dibaca dari smart contract Arbitrum Sepolia!
  // ---------------------------------------------------------------------------
  const [propertyName, setPropertyName] = useState('Bali Sunset Villa #01');
  const [symbol, setSymbol] = useState('VILLA-BALI-01');
  const [documentURI, setDocumentURI] = useState('ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i');
  const [totalFractions, setTotalFractions] = useState(1000);
  const [availableFractions, setAvailableFractions] = useState(990);
  const [priceEth, setPriceEth] = useState('0.001');

  // ---------------------------------------------------------------------------
  // 3. DEKLARASI STATE AKUN INVESTOR
  // ---------------------------------------------------------------------------
  // • account: Alamat dompet MetaMask pengguna (null = belum terhubung).
  // • myFractions: Jumlah lembar kepemilikan unit fraksi milik investor aktif.
  // • cooldownSeconds: Sisa waktu jeda anti-spam (0 = siap melakukan transaksi).
  // ---------------------------------------------------------------------------
  const [account, setAccount] = useState(null);
  const [myFractions, setMyFractions] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // isConnecting: Status loading true/false saat pop-up MetaMask sedang menunggu otorisasi user.
  const [isConnecting, setIsConnecting] = useState(false);

  // Hook timer hitung mundur otomatis untuk periode cooldown anti-spam
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // ---------------------------------------------------------------------------
  // 4. DEKLARASI STATE STATUS TRANSAKSI & FEEDBACK UI
  // ---------------------------------------------------------------------------
  // • isTransacting: Boolean penanda transaksi sedang dikirim ke sequencer Arbitrum.
  // • txStatus: Objek pesan status { type: 'success'|'error'|'info', message: string }.
  // • txHash: Hash transaksi heksadesimal untuk tautan pelacakan ke Arbiscan Sepolia.
  // ---------------------------------------------------------------------------
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // ---------------------------------------------------------------------------
  // 5. DEKLARASI STATE RIWAYAT TRANSAKSI DENGAN LOCALSTORAGE PERSISTENCE
  // ---------------------------------------------------------------------------
  // Pola "Lazy Initial State": Menggunakan fungsi callback di dalam `useState(() => ...)`
  // agar pembacaan memori LocalStorage peramban hanya dilakukan 1x saat aplikasi pertama
  // kali dimuat, bukan pada setiap kali komponen re-render.
  // ---------------------------------------------------------------------------
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('rwa_tx_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Gagal membaca localStorage:', e);
    }
    // Data transaksi contoh awal (Sample fallback):
    return [
      {
        hash: '0x3a7b8e1f5d6c9a4b2e0f183748291a0b5c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f',
        type: 'Beli Fraksi',
        description: 'Pembelian Awal 10 Fraksi (0.010 ETH)',
        timestamp: Date.now() - 3600000,
        status: 'Sukses'
      }
    ];
  });

  // ---------------------------------------------------------------------------
  // 6. HELPER FUNGSI: Menambah & Menyimpan Transaksi ke LocalStorage
  // ---------------------------------------------------------------------------
  const addTransaction = (tx) => {
    setTransactions((prev) => {
      const updated = [tx, ...prev]; // Transaksi baru ditaruh di urutan paling atas
      try {
        localStorage.setItem('rwa_tx_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Gagal menyimpan localStorage:', e);
      }
      return updated;
    });
  };

  // Helper fungsi untuk menghapus seluruh riwayat lokal
  const handleClearHistory = () => {
    try {
      localStorage.removeItem('rwa_tx_history');
    } catch (e) {
      console.error(e);
    }
    setTransactions([]);
  };

  // ---------------------------------------------------------------------------
  // 7. HELPER PROVIDER ANTI-TABRAKAN EKSTENSI MULTI-WALLET
  // ---------------------------------------------------------------------------
  // Banyak ekstensi dompet Web3 (Rabby, Coinbase Wallet, Phantom EVM, OKX Wallet,
  // Trust Wallet) otomatis menyetel flag `isMetaMask = true` ke `window.ethereum`
  // agar dApp lawas tetap berfungsi. Fungsi ini menyaring array `window.ethereum.providers`
  // secara ketat agar browser memilih instance MetaMask asli.
  // ---------------------------------------------------------------------------
  const getProvider = () => {
    if (typeof window === 'undefined' || !window.ethereum) return undefined;

    if (window.ethereum.providers?.length) {
      const realMetaMask = window.ethereum.providers.find(
        (p) =>
          p.isMetaMask &&
          !p.isRabby &&
          !p.isCoinbaseWallet &&
          !p.isPhantom &&
          !p.isOkxWallet &&
          !p.isTrustWallet &&
          !p.isBraveWallet
      );
      if (realMetaMask) return realMetaMask;
    }

    return window.ethereum;
  };

  // ---------------------------------------------------------------------------
  // 8. HANDLER KONEKSI DOMPET (MODE ON-CHAIN)
  // ---------------------------------------------------------------------------
  // Meminta akses akun MetaMask riil (`eth_requestAccounts`) dan memastikan
  // jaringan aktif adalah Arbitrum Sepolia sebelum melanjutkan.
  // ---------------------------------------------------------------------------
  const ensureArbitrumNetwork = async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA_HEX_ID }]
      });
    } catch (err) {
      // Error 4902: Jaringan belum terdaftar di MetaMask, minta daftarkan otomatis
      if (err.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [ARBITRUM_SEPOLIA_NETWORK_PARAMS]
        });
      } else {
        throw err;
      }
    }
  };

  const handleConnectWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      alert("Ekstensi MetaMask tidak terdeteksi! Silakan instal MetaMask.");
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      await ensureArbitrumNetwork();

      const connectedAddr = accounts[0];
      setAccount(connectedAddr);
      await fetchBlockchainData(connectedAddr);
    } catch (err) {
      console.error("Gagal menghubungkan wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 9. READ CALLS: MEMBACA DATA ON-CHAIN (GRATIS GAS)
  // ---------------------------------------------------------------------------
  // Membaca fungsi view (propertyName, availableFractions, dsb.) secara otomatis
  // setiap kali web pertama kali dibuka atau akun dompet berubah.
  // ---------------------------------------------------------------------------
  const fetchBlockchainData = useCallback(async (userAddr) => {
    const providerObj = getProvider();
    if (!providerObj || !PROPERTY_CONTRACT_ADDRESS) return;

    try {
      const provider = new ethers.BrowserProvider(providerObj);
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        provider
      );

      // Baca data umum properti
      const [name, sym, docURI, priceWei, total, available] = await Promise.all([
        contract.propertyName(),
        contract.propertySymbol(),
        contract.propertyDocumentURI(),
        contract.fractionPrice(),
        contract.totalFractions(),
        contract.availableFractions()
      ]);

      setPropertyName(name);
      setSymbol(sym);
      setDocumentURI(docURI);
      setPriceEth(ethers.formatEther(priceWei));
      setTotalFractions(Number(total));
      setAvailableFractions(Number(available));

      // Baca saldo fraksi & waktu cooldown investor jika akun sudah terhubung
      if (userAddr) {
        const [bal, lastTime, cooldownPeriod] = await Promise.all([
          contract.getInvestorFractions(userAddr),
          contract.lastInvestmentTime(userAddr),
          contract.COOLDOWN_PERIOD()
        ]);
        setMyFractions(Number(bal));

        // Hitung sisa detik cooldown berdasarkan waktu on-chain
        const nowSec = Math.floor(Date.now() / 1000);
        const remaining = (Number(lastTime) + Number(cooldownPeriod)) - nowSec;
        if (remaining > 0 && Number(lastTime) > 0) {
          setCooldownSeconds(remaining);
        } else {
          setCooldownSeconds(0);
        }
      }
    } catch (err) {
      console.error("Gagal membaca data on-chain:", err);
    }
  }, []);

  // Hook untuk memicu pembacaan data otomatis saat aplikasi dimuat / akun berubah
  useEffect(() => {
    fetchBlockchainData(account);
  }, [account, fetchBlockchainData]);

  // ---------------------------------------------------------------------------
  // 10. WRITE CALLS: TRANSAKSI PEMBELIAN FRAKSI DENGAN BUFFER GAS ARBITRUM L2
  // ---------------------------------------------------------------------------
  // Arbitrum L2 memproduksi blok sub-detik (~250ms) sehingga `baseFee` berfluktuasi
  // cepat. Buffer `maxFeePerGas: 150%` dari `provider.getFeeData()` wajib dilakukan
  // untuk mencegah error: "max fee per gas less than block base fee".
  // ---------------------------------------------------------------------------
  const handleInvest = async (quantity) => {
    if (!account) {
      alert("Harap hubungkan dompet MetaMask terlebih dahulu!");
      return;
    }

    // 1. Validasi Periode Cooldown Anti-Spam
    if (cooldownSeconds > 0) {
      setTxStatus({
        type: 'error',
        message: `Harap tunggu periode cooldown selesai (${cooldownSeconds} detik lagi)!`
      });
      return;
    }

    if (quantity > availableFractions) {
      setTxStatus({
        type: 'error',
        message: 'Gagal: Jumlah pembelian melebihi sisa kuota fraksi yang tersedia!'
      });
      return;
    }

    try {
      setIsTransacting(true);
      setTxStatus({
        type: 'info',
        message: 'Menunggu persetujuan transaksi di MetaMask...'
      });
      setTxHash(null);

      const activeProvider = getProvider() || window.ethereum;
      const provider = new ethers.BrowserProvider(activeProvider);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        signer
      );

      // 1. Hitung total nilai ETH (harga per lembar fraksi x jumlah)
      const costWei = ethers.parseEther((quantity * parseFloat(priceEth)).toFixed(4));

      // 2. Ambil data gas fee saat ini dan beri buffer 50% (Anti-Revert BaseFee L2)
      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas
        ? (feeData.maxFeePerGas * 150n) / 100n
        : undefined;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
        ? (feeData.maxPriorityFeePerGas * 150n) / 100n
        : undefined;

      // 3. Kirim transaksi dengan parameter gas yang aman
      const tx = await contract.buyFractions(quantity, {
        value: costWei,
        gasLimit: 350000n,
        maxFeePerGas,
        maxPriorityFeePerGas
      });

      setTxStatus({
        type: 'info',
        message: 'Transaksi dikirim ke sequencer Arbitrum (~1-2 detik)...'
      });

      // 4. Tunggu konfirmasi blok on-chain
      const receipt = await tx.wait();
      setTxHash(tx.hash);

      // 5. Aktifkan timer hitung mundur cooldown 10 detik di UI
      setCooldownSeconds(10);

      addTransaction({
        hash: tx.hash,
        type: 'Beli Fraksi',
        description: `Beli ${quantity} Lembar Fraksi (${(quantity * parseFloat(priceEth)).toFixed(3)} ETH)`,
        timestamp: Date.now(),
        status: 'Sukses'
      });

      setTxStatus({
        type: 'success',
        message: `Sukses membeli ${quantity} fraksi on-chain di blok #${receipt.blockNumber}!`
      });

      // Refresh data kuota & portofolio on-chain secara instan
      await fetchBlockchainData(account);
    } catch (err) {
      console.error("Transaksi on-chain gagal:", err);
      let errMsg = "Transaksi dibatalkan atau gagal dieksekusi.";

      // Deteksi pesan revert cooldown dari Smart Contract
      if (err.reason) {
        errMsg = err.reason;
      } else if (err.message && (err.message.includes("cooldown") || err.message.includes("Harap tunggu"))) {
        errMsg = "Revert Smart Contract: Harap tunggu periode cooldown selesai sebelum melakukan investasi lagi!";
      } else if (err.message && err.message.includes("user rejected")) {
        errMsg = "Transaksi ditolak oleh pengguna di MetaMask.";
      } else if (err.shortMessage) {
        errMsg = err.shortMessage;
      }
      setTxStatus({ type: 'error', message: errMsg });
    } finally {
      setIsTransacting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 11. TATA LETAK JSX (RETURN UI)
  // ---------------------------------------------------------------------------
  return (
    <div className="app-container">
      {/* HEADER & STATUS JARINGAN (Navbar) */}
      <Navbar
        account={account}
        onConnect={handleConnectWallet}
        isConnecting={isConnecting}
        connectError={null}
        onDismissConnectError={() => {}}
      />

      <main style={{ marginTop: '24px' }}>
        <div className="grid-dashboard">
          {/* KOLOM KIRI: Kartu Detail Aset Properti & Portofolio Kepemilikan Investor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <PropertyCard
              propertyName={propertyName}
              symbol={symbol}
              availableFractions={availableFractions}
              totalFractions={totalFractions}
              priceEth={priceEth}
              documentURI={documentURI}
            />

            <InvestorPortfolio
              myFractions={myFractions}
              priceEth={priceEth}
              cooldownSeconds={cooldownSeconds}
            />
          </div>

          {/* KOLOM KANAN: Formulir Pembelian Unit Fraksi (InvestBox) */}
          <div>
            <InvestBox
              priceEth={priceEth}
              availableFractions={availableFractions}
              cooldownSeconds={cooldownSeconds}
              onInvest={handleInvest}
              isTransacting={isTransacting}
              txStatus={txStatus}
              txHash={txHash}
            />
          </div>
        </div>

        {/* BAGIAN BAWAH: Tabel Riwayat Transaksi Persisten (Arbiscan Proof) */}
        <TransactionHistory
          transactions={transactions}
          onClearHistory={handleClearHistory}
        />
      </main>
    </div>
  );
}
