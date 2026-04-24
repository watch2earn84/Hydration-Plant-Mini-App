// =========================
// Hydration Plant Mini App (FINAL STABLE)
// =========================

// ------------------------
// CONTRACT CONFIG
// ------------------------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// ------------------------
// ABI (simple + safe)
// ------------------------
const HydrationPlantABI = [
  "function water()",
  "function getWaterCount(address) view returns (uint256)",
  "function stageOf(address) view returns (uint8)"
];

// ------------------------
// GLOBALS (Ethers for read)
// ------------------------
let provider;
let signer;
let contract;
let contractRead;
let currentAccount;

const MAX_STAGE = 4;
const MAX_WATER = 12;

// ------------------------
// PROVIDER SETUP
// ------------------------
function ensureProvider() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    throw new Error("No wallet");
  }

  if (!provider) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  if (!contractRead) {
    contractRead = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, provider);
  }
}

// ------------------------
// CONNECT WALLET
// ------------------------
async function connectWallet() {
  try {
    ensureProvider();

    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    currentAccount = await signer.getAddress();

    contract = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, signer);

    document.getElementById("walletAddress").innerText =
      currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);

    document.getElementById("connectWallet").disabled = true;

    await fetchData();

  } catch (err) {
    console.error(err);
    alert("Wallet connection failed: " + err.message);
  }
}

// ------------------------
// FETCH ONCHAIN DATA
// ------------------------
async function fetchData() {
  if (!contractRead || !currentAccount) return;

  const wc = await contractRead.getWaterCount(currentAccount);
  const st = await contractRead.stageOf(currentAccount);

  document.getElementById("waterCount").innerText = wc.toString();
  document.getElementById("stage").innerText = st.toString();

  const plant = document.getElementById("plant");
  plant.className = "plant-stage-" + Math.min(Number(st), MAX_STAGE);
}

// ------------------------
// VISUAL EFFECTS
// ------------------------
function spawnDrops() {
  const container = document.getElementById("waterDropContainer");

  for (let i = 0; i < 3; i++) {
    const drop = document.createElement("div");
    drop.className = "water-drop";
    container.appendChild(drop);

    setTimeout(() => drop.remove(), 1000);
  }
}

function spawnParticles() {
  const container = document.getElementById("plantContainer");

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    container.appendChild(p);

    setTimeout(() => p.remove(), 900);
  }
}

// ------------------------
// 🚀 WATER FUNCTION (FINAL FIXED)
// ------------------------
async function waterPlant() {
  if (!currentAccount) {
    alert("Connect wallet first");
    return;
  }

  try {
    spawnDrops();

    // 🔥 Force Base network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });

    // ------------------------
    // Viem dynamic import (SAFE)
    // ------------------------
    const { createWalletClient, custom } = await import("https://esm.sh/viem@2.45.0");
    const { base } = await import("https://esm.sh/viem@2.45.0/chains");

    // ------------------------
    // SAFE Builder Code encoding (NO external libs)
    // ------------------------
    const builderSuffix =
      "0x" +
      Array.from(BUILDER_CODE)
        .map(c => c.charCodeAt(0).toString(16))
        .join("");

    // ------------------------
    // Wallet client
    // ------------------------
    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
      dataSuffix: builderSuffix,
    });

    const [address] = await walletClient.getAddresses();

    // ------------------------
    // Send transaction
    // ------------------------
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: HydrationPlantABI,
      functionName: "water",
      account: address,
    });

    console.log("TX HASH:", hash);

    // ------------------------
    // Wait confirmation (Ethers read)
    // ------------------------
    const receipt = await provider.waitForTransaction(hash);

    if (receipt.status === 0) {
      throw new Error("Transaction reverted");
    }

    await fetchData();

    const stage = Number(document.getElementById("stage").innerText);
    const water = Number(document.getElementById("waterCount").innerText);

    if (stage >= MAX_STAGE && water >= MAX_WATER) {
      spawnParticles();
    }

  } catch (err) {
    console.error("TX ERROR:", err);
    alert(err.shortMessage || err.message || "Transaction failed");
  }
}

// ------------------------
// INIT
// ------------------------
window.addEventListener("load", () => {
  const plantContainer = document.getElementById("plantContainer");

  const bloom = document.createElement("div");
  bloom.className = "bloom";
  bloom.innerHTML = '<div class="petal p1"></div><div class="petal p2"></div><div class="center"></div>';
  plantContainer.appendChild(bloom);

  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
