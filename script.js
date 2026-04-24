// =========================
// Hydration Plant Mini App (FINAL FIXED WITH BUILDER CODE)
// =========================

// ------------------------
// CONFIG
// ------------------------
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";
const BUILDER_CODE = "bc_gfrlgx8t";

// ------------------------
// ABI (Ethers for read + encoding)
// ------------------------
const HydrationPlantABI = [
  {
    name: "water",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "getWaterCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "stageOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint8" }]
  }
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
    alert("Install MetaMask");
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

// ------------------------
// 🔥 FIXED WATER FUNCTION (BUILDER CODE WORKS HERE)
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

    // import viem
    const { createWalletClient, custom, encodeFunctionData } =
      await import("https://esm.sh/viem@2.45.0");
    const { base } =
      await import("https://esm.sh/viem@2.45.0/chains");

    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    const [address] = await walletClient.getAddresses();

    // encode function call
    const data = encodeFunctionData({
      abi: HydrationPlantABI,
      functionName: "water",
    });

    // ------------------------
    // 🚀 THIS IS WHERE BUILDER CODE IS INCLUDED
    // ------------------------
    const builderSuffix =
      "0x" +
      Array.from(BUILDER_CODE)
        .map(c => c.charCodeAt(0).toString(16))
        .join("");

    const hash = await walletClient.sendTransaction({
      account: address,
      to: CONTRACT_ADDRESS,
      data,
      dataSuffix: builderSuffix,
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
// PARTICLES
// ------------------------
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
// INIT
// ------------------------
window.addEventListener("load", () => {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("waterButton").onclick = waterPlant;
});
