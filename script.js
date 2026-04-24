// =========================
// FINAL script.js
// =========================

// --- IMPORTS (CDN, NO npm needed) ---
import { createWalletClient, custom } from "https://esm.sh/viem@2.45.0";
import { base } from "https://esm.sh/viem@2.45.0/chains";
import { Attribution } from "https://esm.sh/ox@0.1.0/erc8021";

// --- CONFIG ---
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// --- ABI ---
const HydrationPlantABI = [
  { "inputs": [], "name": "water", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getWaterCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "stageOf", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "newCount", "type": "uint256" }, { "indexed": false, "internalType": "uint8", "name": "newStage", "type": "uint8" }], "name": "Watered", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Transfer", "type": "event" }
];

// --- GLOBALS ---
let provider = null;
let signer = null;
let contract = null;
let contractRead = null;
let currentAccount = null;
const MAX_STAGE = 4;

// --- PROVIDER ---
function ensureProvider() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    throw new Error("No provider");
  }
  if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
  if (!contractRead) contractRead = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, provider);
}

// --- SIGNER ---
async function ensureSigner() {
  ensureProvider();
  if (!signer) {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, signer);
    setupEventListeners();
  }
}

// --- EVENTS ---
function setupEventListeners() {
  if (!contractRead) return;

  contractRead.on("Watered", (user, newCount, newStage) => {
    if (user.toLowerCase() === currentAccount.toLowerCase()) {
      updateUI(newCount.toString(), Number(newStage));
    }
  });

  contractRead.on("Transfer", (from, to, tokenId) => {
    if (to.toLowerCase() === currentAccount.toLowerCase()) {
      alert("🎉 NFT Minted! Token ID: " + tokenId);
    }
  });
}

// --- UI ---
function updateUI(wc, stage) {
  document.getElementById("waterCount").innerText = wc;
  document.getElementById("stage").innerText = stage;

  const plant = document.getElementById("plant");
  plant.className = "plant-stage-" + Math.min(stage, MAX_STAGE);
}

// --- FETCH ---
async function fetchData() {
  ensureProvider();

  const accounts = await provider.listAccounts();
  if (!accounts.length) return;

  currentAccount = accounts[0];

  const wc = await contractRead.getWaterCount(currentAccount);
  const stage = await contractRead.stageOf(currentAccount);

  updateUI(wc.toString(), Number(stage));
}

// --- 🚀 WATER FUNCTION (FINAL FIXED) ---
async function waterPlant() {
  try {
    await ensureSigner();

    spawnDrops();

    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
      dataSuffix: Attribution.toDataSuffix({
        codes: [BUILDER_CODE],
      }),
    });

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: HydrationPlantABI,
      functionName: "water",
      account: currentAccount,
    });

    console.log("tx:", hash);

    const receipt = await provider.waitForTransaction(hash);

    if (receipt.status === 0) {
      alert("Transaction failed");
      return;
    }

    const newWC = await contractRead.getWaterCount(currentAccount);
    const newStage = await contractRead.stageOf(currentAccount);

    updateUI(newWC.toString(), Number(newStage));

    if (Number(newStage) >= MAX_STAGE) {
      spawnParticles();
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// --- VISUALS ---
function spawnDrops() {
  const container = document.getElementById("waterDropContainer");
  if (!container) return;

  for (let i = 0; i < 3; i++) {
    const drop = document.createElement("div");
    drop.className = "water-drop";
    container.appendChild(drop);
    setTimeout(() => container.removeChild(drop), 1200);
  }
}

function spawnParticles() {
  const container = document.getElementById("plantContainer");
  if (!container) return;

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    container.appendChild(p);
    setTimeout(() => container.removeChild(p), 900);
  }
}

// --- INIT ---
window.addEventListener("load", async () => {
  ensureProvider();

  document.getElementById("connectWallet").onclick = async () => {
    await ensureSigner();
    document.getElementById("walletAddress").innerText =
      currentAccount.slice(0,6) + "..." + currentAccount.slice(-4);
    await fetchData();
  };

  document.getElementById("waterButton").onclick = waterPlant;

  await fetchData();
});
