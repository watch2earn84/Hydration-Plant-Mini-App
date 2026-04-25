// =========================
// Hydration Plant Mini App (FINAL WORKING)
// =========================

// ------------------------
// CONFIG
// ------------------------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";

// ✅ FULL ERC-8021 ENCODED SUFFIX (DO NOT CHANGE)
const DATA_SUFFIX =
  "0x62635f6766726c677838740b0080218021802180218021802180218021";

// ------------------------
// ABI
// ------------------------
const ABI = [
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
let account;

const MAX_STAGE = 4;
const MAX_WATER = 12;

// ------------------------
// INIT PROVIDER
// ------------------------
function initProvider() {
  if (!window.ethereum) {
    alert("Install MetaMask");
    throw new Error("No wallet");
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
}

// ------------------------
// CONNECT WALLET
// ------------------------
async function connectWallet() {
  try {
    initProvider();

    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();
    account = await signer.getAddress();

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    document.getElementById("walletAddress").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    document.getElementById("connectWallet").disabled = true;

    console.log("Connected:", account);

    await loadData();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// ------------------------
// LOAD DATA
// ------------------------
async function loadData() {
  if (!contract || !account) return;

  const water = await contract.getWaterCount(account);
  const stage = await contract.stageOf(account);

  document.getElementById("waterCount").innerText = water.toString();
  document.getElementById("stage").innerText = stage.toString();

  document.getElementById("plant").className =
    "plant-stage-" + Math.min(Number(stage), MAX_STAGE);
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
  if (!c) return;

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    c.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

// ------------------------
// 🚀 WATER FUNCTION (FINAL FIX)
// ------------------------
async function waterPlant() {
  if (!account) {
    alert("Connect wallet first");
    return;
  }

  try {
    spawnDrops();

    // encode normal function
    const iface = new ethers.utils.Interface(ABI);
    let data = iface.encodeFunctionData("water");

    // ✅ append FULL 8021 suffix
    data = data + DATA_SUFFIX.slice(2);

    console.log("FINAL DATA:", data);

    // send raw transaction
    const tx = await signer.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: data
    });

    console.log("TX SENT:", tx.hash);

    await tx.wait();

    console.log("TX CONFIRMED");

    await loadData();

    const stage = Number(document.getElementById("stage").innerText);
    const water = Number(document.getElementById("waterCount").innerText);

    if (stage >= MAX_STAGE && water >= MAX_WATER) {
      spawnParticles();
    }

  } catch (err) {
    console.error("TX ERROR:", err);
    alert(err.message || "Transaction failed");
  }
}

// ------------------------
// INIT
// ------------------------
window.addEventListener("load", () => {
  console.log("App Loaded");

  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
