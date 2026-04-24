// =========================
// FINAL WORKING SCRIPT
// =========================

// ---------- IMPORTS ----------
import { createWalletClient, custom } from "https://esm.sh/viem@2.45.0";
import { base } from "https://esm.sh/viem@2.45.0/chains";
import { Attribution } from "https://esm.sh/ox@0.1.0/erc8021";

// ---------- CONFIG ----------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// ---------- ABI ----------
const ABI = [
  "function water()",
  "function getWaterCount(address) view returns (uint256)",
  "function stageOf(address) view returns (uint8)"
];

// ---------- GLOBALS ----------
let provider;
let signer;
let contract;
let contractRead;
let account;
const MAX_STAGE = 4;

// ---------- SAFE PROVIDER ----------
function ensureProvider() {
  if (!window.ethereum) {
    alert("MetaMask not found!");
    throw new Error("No wallet");
  }

  if (!provider) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("Provider ready");
  }

  if (!contractRead) {
    contractRead = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }
}

// ---------- CONNECT WALLET ----------
async function connectWallet() {
  try {
    console.log("Connecting wallet...");

    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    ensureProvider();

    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();
    account = await signer.getAddress();

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    document.getElementById("walletAddress").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    console.log("Wallet connected:", account);

    await loadData();

  } catch (err) {
    console.error("Connect error:", err);
    alert(err.message);
  }
}

// ---------- LOAD DATA ----------
async function loadData() {
  try {
    ensureProvider();

    const wc = await contractRead.getWaterCount(account);
    const st = await contractRead.stageOf(account);

    document.getElementById("waterCount").innerText = wc.toString();
    document.getElementById("stage").innerText = st.toString();

    const plant = document.getElementById("plant");
    plant.className = "plant-stage-" + Math.min(Number(st), MAX_STAGE);

  } catch (err) {
    console.error("Load error:", err);
  }
}

// ---------- WATER (WITH BUILDER CODE) ----------
async function waterPlant() {
  try {
    if (!account) {
      alert("Connect wallet first");
      return;
    }

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
      abi: ABI,
      functionName: "water",
      account,
    });

    console.log("TX:", hash);

    await provider.waitForTransaction(hash);

    await loadData();

  } catch (err) {
    console.error("Water error:", err);
    alert(err.message);
  }
}

// ---------- UI EFFECTS ----------
function spawnDrops() {
  const c = document.getElementById("waterDropContainer");

  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.className = "drop";
    c.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
}

// ---------- EVENTS ----------
window.addEventListener("load", () => {
  console.log("App loaded");

  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
