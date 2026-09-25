// =============================================================================
// FILE: src/constants/contract.js
// DESKRIPSI: Konfigurasi Smart Contract RWA & Jaringan Arbitrum Sepolia
// =============================================================================
// File ini bertindak sebagai "buku alamat dan kamus komunikasi" bagi frontend
// untuk mengenali, menghubungi, dan berinteraksi dengan smart contract di blockchain.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. ALAMAT SMART CONTRACT RWA (CONTRACT ADDRESS / CA)
// -----------------------------------------------------------------------------
// • Alamat unik smart contract di jaringan Arbitrum Sepolia.
// • PADA MODE MOCK: Menggunakan alamat dummy "0x0000000000000000000000000000000000000000".
// • PADA MODE ON-CHAIN: Ganti nilai string ini dengan Contract Address (CA)
//   yang Anda dapatkan dari panel Deployed Contracts di Remix IDE setelah proses deploy!
// -----------------------------------------------------------------------------
export const PROPERTY_CONTRACT_ADDRESS = "0xc8Ed90cE140b771272886079e1f0C7362503324b";

// -----------------------------------------------------------------------------
// 2. PARAMETER JARINGAN ARBITRUM SEPOLIA (EIP-3085 & EIP-3326)
// -----------------------------------------------------------------------------
// Digunakan oleh fungsi `ensureArbitrumNetwork()` di App.jsx untuk:
// 1. Meminta MetaMask otomatis berpindah ke Arbitrum Sepolia (wallet_switchEthereumChain).
// 2. Jika belum ada di MetaMask user (Error 4902), MetaMask akan otomatis memunculkan
//    pop-up persetujuan untuk menambahkan jaringan ini (wallet_addEthereumChain).
// -----------------------------------------------------------------------------
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// 421614 dalam format heksadesimal (wajib diawali 0x untuk standar RPC Ethereum):
export const ARBITRUM_SEPOLIA_HEX_ID = "0x66eee";

export const ARBITRUM_SEPOLIA_NETWORK_PARAMS = {
  chainId: ARBITRUM_SEPOLIA_HEX_ID,
  chainName: "Arbitrum Sepolia Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"]
};

// -----------------------------------------------------------------------------
// 3. APPLICATION BINARY INTERFACE (ABI)
// -----------------------------------------------------------------------------
// • ABI adalah "Kamus Penerjemah" berformat JSON yang memberitahu pustaka Ethers.js
//   fungsi-fungsi apa saja yang tersedia di smart contract Solidity (nama fungsi,
//   tipe input parameter, dan tipe data kembalian).
// • PADA MODE MOCK: Variabel ini sengaja di-comment out agar peserta workshop
//   dapat mempraktikkan proses ekstraksi ABI dari Remix secara mandiri.
// • PADA MODE ON-CHAIN: Hapus tanda komentar `//` di bawah ini, lalu tempelkan (paste)
//   seluruh array JSON yang disalin dari tombol 'ABI' pada panel Solidity Compiler di Remix.
// -----------------------------------------------------------------------------

export const FRACTIONAL_PROPERTY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "investor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalCost", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "remainingFractions", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FractionPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "additionalFractions", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newAvailableFractions", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FractionsRestocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FundsWithdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COOLDOWN_PERIOD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "availableFractions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }],
    "name": "buyFractions",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "fractionBalances",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fractionPrice",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_investor", "type": "address" }],
    "name": "getInvestorFractions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyFractions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "lastInvestmentTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyDocumentURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyName",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertySymbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_additionalFractions", "type": "uint256" }],
    "name": "restockFractions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalFractions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];