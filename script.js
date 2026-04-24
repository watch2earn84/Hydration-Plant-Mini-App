// =========================
// Hydration Plant Mini App (FINAL FIXED)
// =========================

// ------------------------
// CONTRACT
// ------------------------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// ------------------------
// ABI
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
    alert("Please install MetaMask!");
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
    alert("Wallet connection failed");
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

  const plant = document.getElementById("plant");
  plant.className = "plant-stage-" + Math.min(Number(st), MAX_STAGE);
}

// ------------------------
// VISUALS
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
// 🚀 WATER FUNCTION (WITH BUILDER CODE)
// ------------------------
async function waterPlant() {
  if (!currentAccount) {
    alert("Connect wallet first");
    return;
  }

  try {
    spawnDrops();

    // Import viem dynamically (safe for browser)
    const { createWalletClient, custom } = await import("https://esm.sh/viem@2.45.0");
    const { base } = await import("https://esm.sh/viem@2.45.0/chains");
    const { Attribution } = await import("https://esm.sh/ox@0.1.0/erc8021");

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

    console.log("TX:", hash);

    const receipt = await provider.waitForTransaction(hash);

    if (receipt.status === 0) {
      alert("Transaction failed");
      return;
    }

    await fetchData();

    const stage = Number(document.getElementById("stage").innerText);
    const water = Number(document.getElementById("waterCount").innerText);

    if (stage >= MAX_STAGE && water >= MAX_WATER) {
      spawnParticles();
    }

  } catch (err) {
    console.error(err);
    alert("Transaction error");
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

  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("waterButton").addEventListener("click", waterPlant);
});
