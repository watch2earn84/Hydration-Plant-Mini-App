// =========================
// Hydration Plant Mini App (STABLE FINAL VERSION)
// =========================

// ------------------------
// CONFIG
// ------------------------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// ------------------------
// ABI (Ethers read only)
// ------------------------
const HydrationPlantABI = [
  "function water()",
  "function getWaterCount(address) view returns (uint256)",
  "function stageOf(address) view returns (uint8)"
];

// ------------------------
// GLOBALS
// ------------------------
let provider;
let signer;
let contract;
let contractRead;
let currentAccount;

const MAX_STAGE = 4;
const MAX_WATER = 12;

// ------------------------
// INIT PROVIDER
// ------------------------
function ensureProvider() {
  if (!window.ethereum) {
    alert("MetaMask not detected");
    throw new Error("No wallet found");
  }

  if (!provider) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  if (!contractRead) {
    contractRead = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, provider);
  }
}

// ------------------------
// CONNECT WALLET (FIXED - GUARANTEED POPUP)
// ------------------------
async function connectWallet() {
  try {
    console.log("Connect clicked...");

    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    ensureProvider();

    // ✔ DIRECT MetaMask call (MOST RELIABLE)
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("Accounts:", accounts);

    if (!accounts || accounts.length === 0) {
      alert("No wallet account found");
      return;
    }

    currentAccount = accounts[0];

    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, signer);

    document.getElementById("walletAddress").innerText =
      currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);

    document.getElementById("connectWallet").disabled = true;

    await fetchData();

  } catch (err) {
    console.error("CONNECT ERROR:", err);
    alert(err.message || "Wallet connection failed");
  }
}

// ------------------------
// FETCH DATA
// ------------------------
async function fetchData() {
  try {
    if (!contractRead || !currentAccount) return;

    const wc = await contractRead.getWaterCount(currentAccount);
    const st = await contractRead.stageOf(currentAccount);

    document.getElementById("waterCount").innerText = wc.toString();
    document.getElementById("stage").innerText = st.toString();

    document.getElementById("plant").className =
      "plant-stage-" + Math.min(Number(st), MAX_STAGE);

  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

// ------------------------
// EFFECTS
// ------------------------
function spawnDrops() {
  const c = document.getElementById("waterDropContainer");

  if (!c) return;

  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.className = "water-drop";
    c.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
}

function spawnParticles() {
  const c = document.getElementById("plantContainer");

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    c.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

// ------------------------
// WATER FUNCTION (SAFE + SIMPLE)
// ------------------------
async function waterPlant() {
  if (!currentAccount) {
    alert("Connect wallet first");
    return;
  }

  try {
    spawnDrops();

    const tx = await contract.water();
    console.log("TX SENT:", tx.hash);

    await tx.wait();

    await fetchData();

    const stage = Number(document.getElementById("stage").innerText);
    const water = Number(document.getElementById("waterCount").innerText);

    if (stage >= MAX_STAGE && water >= MAX_WATER) {
      spawnParticles();
    }

  } catch (err) {
    console.error("WATER ERROR:", err);
    alert(err.reason || err.message || "Transaction failed");
  }
}

// ------------------------
// INIT
// ------------------------
window.addEventListener("load", () => {
  console.log("App loaded");

  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
