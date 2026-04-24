const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";

const ABI = [
  "function water() public",
  "function getWaterCount(address) view returns (uint256)",
  "function stageOf(address) view returns (uint8)"
];

let provider;
let signer;
let contract;
let account;

function initProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  provider = new ethers.providers.Web3Provider(window.ethereum);
}

async function connectWallet() {
  try {
    console.log("Connecting wallet...");

    initProvider();

    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();
    account = await signer.getAddress();

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    document.getElementById("walletAddress").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    console.log("Connected:", account);

    await loadData();
  } catch (err) {
    console.error("Wallet error:", err);
    alert(err.message);
  }
}

async function loadData() {
  if (!contract || !account) return;

  const water = await contract.getWaterCount(account);
  const stage = await contract.stageOf(account);

  document.getElementById("waterCount").innerText = water.toString();
  document.getElementById("stage").innerText = stage.toString();

  const plant = document.getElementById("plant");
  plant.className = "plant-stage-" + stage;
}

async function waterPlant() {
  try {
    if (!contract) return alert("Connect wallet first");

    console.log("Sending tx...");

    const tx = await contract.water();
    await tx.wait();

    console.log("TX confirmed:", tx.hash);

    await loadData();

  } catch (err) {
    console.error("TX error:", err);
    alert(err.message);
  }
}

window.addEventListener("load", () => {
  console.log("App loaded");

  document
    .getElementById("connectWallet")
    .addEventListener("click", connectWallet);

  document
    .getElementById("waterButton")
    .addEventListener("click", waterPlant);
});
