// ------------------------
// Hydration Plant Mini App
// ------------------------

// Contract address
const CONTRACT_ADDRESS = "0x1C7faa92C11b6187eca199F57380A402a1e65814";

// Minimal ABI
const HydrationPlantABI = [
  {"inputs":[],"name":"water","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getWaterCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"stageOf","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}
];

let provider, signer, contract, currentAccount;
const MAX_STAGE = 4;

// Ensure provider
function ensureProvider() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    throw new Error("No metamask");
  }
  if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
}

// Connect wallet
async function connectWallet(){
  try {
    ensureProvider();
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, HydrationPlantABI, signer);

    document.getElementById("walletAddress").innerText = currentAccount.slice(0,6) + "..." + currentAccount.slice(-4);
    document.getElementById("connectWallet").disabled = true;

    await fetchData();
  } catch(e){ console.error(e); alert("Wallet connect failed: "+(e.message||e)); }
}

// Show / hide loading
function showLoading(show = true){
  document.getElementById("loadingIndicator").style.display = show ? "block" : "none";
}

// Fetch data from chain and update UI
async function fetchData() {
  if (!contract || !currentAccount) return;
  try {
    let wc = await contract.getWaterCount(currentAccount);
    let stage = await contract.stageOf(currentAccount);

    if (wc && typeof wc.toString === "function") wc = wc.toString();
    stage = Number(stage);
    stage = Math.min(stage, MAX_STAGE);

    document.getElementById("waterCount").innerText = wc;
    document.getElementById("stage").innerText = stage;

    const plant = document.getElementById("plant");
    if (plant) {
      plant.className = "";
      plant.classList.add("plant-stage-" + stage);
    }

    console.log("fetchData -> addr:", currentAccount, "wc:", wc, "stage:", stage);
  } catch (err) {
    console.error("fetchData error:", err);
  }
}

// Spawn water drops
function spawnDrops(){
  const container = document.getElementById("waterDropContainer");
  for(let i=0;i<3;i++){
    const drop = document.createElement("div");
    drop.className = "water-drop";
    const x = (Math.random()*50)-25;
    drop.style.left = (30 + x) + "px";
    const dur = 1.5 + Math.random()*0.6; // slower animation
    drop.style.animationDuration = dur + "s";
    container.appendChild(drop);
    setTimeout(()=>{ try{ container.removeChild(drop);}catch{} }, Math.round(dur*1000)+120);
  }
}

// Confetti particles
function spawnParticles(){
  const container = document.getElementById("plantContainer");
  const colors = ["#ff7a7a","#ffd166","#7afcff","#b39ddb","#86efac"];
  for(let i=0;i<14;i++){
    const p = document.createElement("div");
    p.className = "particle";
    p.style.background = colors[i % colors.length];
    const tx = (Math.random()*140 - 70) + "px";
    p.style.setProperty('--tx', tx);
    p.style.left = (70 + Math.random()*20 -10) + "px";
    p.style.bottom = "24px";
    container.appendChild(p);
    setTimeout(()=>{ try{ container.removeChild(p);}catch{} }, 900);
  }
}

// Water plant
async function waterPlant(){
  try {
    ensureProvider();
    if(!signer) await connectWallet();

    // Show loading
    showLoading(true);

    // Visual first
    spawnDrops();

    const tx = await contract.water();
    await tx.wait();

    await fetchData();

    const stage = Number(document.getElementById("stage").innerText || 0);
    if(stage >= MAX_STAGE){
      spawnParticles();
      const plant = document.getElementById("plant");
      plant.style.transform = "scale(1.04)";
      setTimeout(()=>{ plant.style.transform = "scale(1)"; }, 480);
    }

    // Hide loading
    showLoading(false);

  } catch(err){
    console.error("waterPlant:",err);
    alert("Transaction error: " + (err.message || err));
    showLoading(false);
  }
}

// Init on load
window.addEventListener("load", ()=>{
  const plantContainer = document.getElementById("plantContainer");
  const bloom = document.createElement("div");
  bloom.className = "bloom";
  bloom.innerHTML = '<div class="petal p1"></div><div class="petal p2"></div><div class="center"></div>';
  plantContainer.appendChild(bloom);

  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("waterButton").addEventListener("click", waterPlant);
});
