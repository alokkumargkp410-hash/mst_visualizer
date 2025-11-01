const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
const logBox = document.getElementById("log");
const startNodeSelect = document.getElementById("startNode");
const nodeCountInput = document.getElementById("nodeCount");
const edgeCountInput = document.getElementById("edgeCount");

let nodes = [];
let edges = [];
let primState = {};
let kruskalState = {};
let stopFlag = false;
let autoRunning = false;

// 🔹 Generate Graph
function generateGraph() {
  const n = parseInt(nodeCountInput.value);
  const eCount = parseInt(edgeCountInput.value);
  if (isNaN(n) || n < 2) {
    alert("Please enter at least 2 nodes.");
    return;
  }

  nodes = [];
  edges = [];
  resetLog();
  document.getElementById("result").innerHTML = "";
  primState = {};
  kruskalState = {};
  stopFlag = false;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2.5;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodes.push({ x, y });
  }

  let allEdges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allEdges.push({
        u: i,
        v: j,
        w: Math.floor(Math.random() * 20) + 1,
        state: "unused",
      });
    }
  }

  for (let i = 0; i < Math.min(eCount, allEdges.length); i++) {
    const rand = Math.floor(Math.random() * allEdges.length);
    edges.push(allEdges.splice(rand, 1)[0]);
  }

  startNodeSelect.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.text = "Node " + i;
    startNodeSelect.appendChild(opt);
  }

  log(`🧩 Graph generated with ${n} nodes and ${edges.length} edges.`);
  drawGraph();
}

// 🔹 Draw Graph
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let e of edges) {
    ctx.beginPath();
    let color =
      e.state === "selected"
        ? "lime"
        : e.state === "considered"
        ? "yellow"
        : e.state === "rejected"
        ? "red"
        : "gray";
    ctx.strokeStyle = color;
    ctx.lineWidth = e.state === "selected" ? 3 : 1.3;
    ctx.moveTo(nodes[e.u].x, nodes[e.u].y);
    ctx.lineTo(nodes[e.v].x, nodes[e.v].y);
    ctx.stroke();

    const midX = (nodes[e.u].x + nodes[e.v].x) / 2;
    const midY = (nodes[e.u].y + nodes[e.v].y) / 2;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(e.w, midX, midY - 10);
  }

  for (let i = 0; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText(i, nodes[i].x, nodes[i].y);
  }
}

// 🔹 Helper
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function log(msg) {
  logBox.innerHTML += msg + "<br>";
  logBox.scrollTop = logBox.scrollHeight;
}
function resetLog() {
  logBox.innerHTML = "";
}

// 🔹 Clear temporary states (yellow/red)
function clearTemporaryStates() {
  for (let e of edges) {
    if (e.state === "considered" || e.state === "rejected") {
      e.state = "unused";
    }
  }
}

// 🔹 Show Result
function showResult(algorithm) {
  const selected = edges.filter((e) => e.state === "selected");
  const total = selected.reduce((sum, e) => sum + e.w, 0);
  const edgeList = selected.map((e) => `(${e.u},${e.v})=${e.w}`).join(", ");
  document.getElementById("result").innerHTML = `
    <b>✅ ${algorithm} MST Complete!</b><br>
    <b>Total Weight:</b> ${total}<br>
    <b>Selected Edges:</b> ${edgeList}
  `;
}

// 🔹 Prim’s Algorithm
async function primNextStep(auto = false) {
  clearTemporaryStates(); // remove old yellow/red before next step
  drawGraph();

  const n = nodes.length;
  if (!primState.inMST) {
    primState = { inMST: Array(n).fill(false), finished: false };
    const start = parseInt(startNodeSelect.value);
    primState.inMST[start] = true;
    log(`🔹 Started Prim’s algorithm from node ${start}.`);
    return;
  }

  if (primState.finished) return;

  let best = null;
  for (let e of edges) {
    const in1 = primState.inMST[e.u];
    const in2 = primState.inMST[e.v];
    if (in1 ^ in2) {
      e.state = "considered";
      drawGraph();
      if (auto) await wait(200);
      if (!best || e.w < best.w) best = e;
    }
  }

  if (!best) {
    primState.finished = true;
    showResult("Prim’s");
    log("✅ MST complete (Prim’s).");
    autoStopIfDone();
    return;
  }

  for (let e of edges) {
    if (e.state === "considered" && e !== best) e.state = "rejected";
  }

  best.state = "selected";
  primState.inMST[best.u] = primState.inMST[best.v] = true;

  drawGraph();
  log(`🟢 Selected edge (${best.u},${best.v}) = ${best.w}`);
  if (auto) await wait(400);
}

// 🔹 Kruskal’s Algorithm
async function kruskalNextStep(auto = false) {
  clearTemporaryStates(); // remove old yellow/red before next step
  drawGraph();

  const n = nodes.length;
  if (!kruskalState.uf) {
    kruskalState = {
      edges: [...edges].sort((a, b) => a.w - b.w),
      uf: Array.from({ length: n }, (_, i) => i),
      mstCount: 0,
    };
    log("🔹 Started Kruskal’s algorithm.");
    return;
  }

  if (kruskalState.mstCount === n - 1) {
    showResult("Kruskal’s");
    log("✅ MST complete (Kruskal’s).");
    autoStopIfDone();
    return;
  }

  const e = kruskalState.edges.shift();
  if (!e) return;

  e.state = "considered";
  drawGraph();
  if (auto) await wait(300);

  const find = (x) =>
    kruskalState.uf[x] === x ? x : (kruskalState.uf[x] = find(kruskalState.uf[x]));
  const u = find(e.u),
    v = find(e.v);

  if (u !== v) {
    kruskalState.uf[u] = v;
    e.state = "selected";
    kruskalState.mstCount++;
    log(`🟢 Selected edge (${e.u},${e.v}) = ${e.w}`);
  } else {
    e.state = "rejected";
    log(`❌ Rejected edge (${e.u},${e.v}) = ${e.w} (forms a cycle)`);
  }

  drawGraph();
  if (auto) await wait(400);
}

// 🔹 Stop
document.getElementById("stop").onclick = () => {
  stopFlag = true;
  autoRunning = false;
  document.getElementById("auto").disabled = false;
  log("🛑 Algorithm stopped by user.");
};

// 🔹 Auto Stop
function autoStopIfDone() {
  if (autoRunning) {
    autoRunning = false;
    document.getElementById("auto").disabled = false;
    log("⏹ Auto Run completed — MST is ready.");
  }
}

// 🔹 Controls
document.getElementById("generate").onclick = generateGraph;
document.getElementById("next").onclick = async () => {
  const algo = document.getElementById("algo").value;
  if (algo === "prim") await primNextStep();
  else await kruskalNextStep();
};

document.getElementById("auto").onclick = async () => {
  stopFlag = false;
  autoRunning = true;
  const autoBtn = document.getElementById("auto");
  autoBtn.disabled = true;

  const algo = document.getElementById("algo").value;
  if (algo === "prim") primState = {};
  else kruskalState = {};

  log("▶️ Auto Run started...");

  while (!stopFlag) {
    if (algo === "prim") await primNextStep(true);
    else await kruskalNextStep(true);

    if (
      stopFlag ||
      (algo === "prim" && primState.finished) ||
      (algo === "kruskal" && kruskalState.mstCount === nodes.length - 1)
    ) {
      autoStopIfDone();
      break;
    }
  }

  autoBtn.disabled = false;
};

// 🔹 Reset
document.getElementById("reset").onclick = () => {
  edges.forEach((e) => (e.state = "unused"));
  primState = {};
  kruskalState = {};
  resetLog();
  drawGraph();
  document.getElementById("result").innerHTML = "";
  log("🔄 Reset done.");
};

// Init
generateGraph();

