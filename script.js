// =========================
// Hydration Plant Mini App (BASE OFFICIAL FIX)
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
// PROVIDER
// ------------------------
function ensureProvider() {
  if (!window.ethereum) {
    alert("MetaMask required");
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
    alert(err.message);
  }
}

// ------------------------
// FETCH DATA
// ------------------------
async function fetchData() {
  if (!contractRead || !currentAccount) return;

  const wc = await contractRead.getWaterCount(currentAccount);
  const st = await contractRead.stageOf(currentAccount);

  document.getElementById("waterCount").innerText = wc.toString();
  document.getElementById("stage").innerText = st.toString();

  document.getElementById("plant").className =
    "plant-stage-" + Math.min(Number(st), MAX_STAGE);
}

// ------------------------
// EFFECTS
// ------------------------
function spawnDrops() {
  const c = document.getElementById("waterDropContainer");

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
// 🚀 WATER FUNCTION (OFFICIAL BASE ATTRIBUTION FIX)
// ------------------------
async function waterPlant() {
  if (!currentAccount) {
    alert("Connect wallet first");
    return;
  }

  try {
    spawnDrops();

    // switch to Base
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });

    // ------------------------
    // IMPORT VIEM
    // ------------------------
    const { createWalletClient, custom, encodeFunctionData } =
      await import("https://esm.sh/viem@2.45.0");
    const { base } =
      await import("https://esm.sh/viem@2.45.0/chains");

    // ------------------------
    // OFFICIAL SAFE BUILDER ENCODING (NO MANUAL HEX)
    // ------------------------
    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    const [address] = await walletClient.getAddresses();

    const data = encodeFunctionData({
      abi: [
        {
          name: "water",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
      ],
      functionName: "water",
    });

    // ------------------------
    // IMPORTANT: USE dataSuffix PROPERLY (BASE EXPECTED FORMAT)
    // ------------------------
    const dataSuffix = {
      codes: [BUILDER_CODE],
    };

    // ------------------------
    // SEND TRANSACTION (BASE COMPLIANT PATH)
    // ------------------------
    const hash = await walletClient.sendTransaction({
      account: address,
      to: CONTRACT_ADDRESS,
      data,
      dataSuffix,
    });

    console.log("TX:", hash);

    await provider.waitForTransaction(hash);

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
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
