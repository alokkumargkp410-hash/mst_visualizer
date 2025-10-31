const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
const logBox = document.getElementById("log");
const startNodeSelect = document.getElementById("startNode");
const nodeCountInput = document.getElementById("nodeCount");

let nodes = [];
let edges = [];
let primState = {};
let kruskalState = {};
let stopFlag = false;

// 🔹 Generate Graph with Circular Layout
function generateGraph() {
  const n = parseInt(nodeCountInput.value);
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

  // ✅ Arrange nodes in a circle
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2.5;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodes.push({ x, y });
  }

  // ✅ Generate edges with decent density
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < 0.35) continue; // reduce clutter
      edges.push({
        u: i,
        v: j,
        w: Math.floor(Math.random() * 20) + 1,
        state: "unused",
      });
    }
  }

  // Ensure at least n-1 edges exist
  if (edges.length < n - 1) {
    for (let i = 0; i < n - 1; i++) {
      edges.push({
        u: i,
        v: i + 1,
        w: Math.floor(Math.random() * 15) + 1,
        state: "unused",
      });
    }
  }

  // Populate start node dropdown
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

  // Draw edges
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
    ctx.lineWidth = e.state === "selected" ? 3 : 1.2;
    ctx.moveTo(nodes[e.u].x, nodes[e.u].y);
    ctx.lineTo(nodes[e.v].x, nodes[e.v].y);
    ctx.stroke();

    // Weight label (slightly offset)
    const midX = (nodes[e.u].x + nodes[e.v].x) / 2;
    const midY = (nodes[e.u].y + nodes[e.v].y) / 2;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(e.w, midX, midY - 10);
  }

  // Draw nodes
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

// 🔹 Logging
function log(msg) {
  logBox.innerHTML += msg + "<br>";
  logBox.scrollTop = logBox.scrollHeight;
}
function resetLog() {
  logBox.innerHTML = "";
}

// 🔹 Show Result
function showResult(algorithm) {
  const selected = edges.filter((e) => e.state === "selected");
  const total = selected.reduce((sum, e) => sum + e.w, 0);
  const resultBox = document.getElementById("result");

  if (selected.length === 0) {
    resultBox.innerHTML = "";
    return;
  }

  const edgeList = selected.map((e) => `(${e.u}, ${e.v})=${e.w}`).join(", ");
  resultBox.innerHTML = `
    <b>✅ ${algorithm} MST Complete!</b><br>
    <b>Total Weight:</b> ${total}<br>
    <b>Selected Edges:</b> ${edgeList}
  `;
}

// 🔹 Prim’s Algorithm
function primNextStep() {
  const n = nodes.length;
  if (!primState.inMST) {
    primState = { inMST: Array(n).fill(false), finished: false };
    const start = parseInt(startNodeSelect.value);
    primState.inMST[start] = true;
    log(`🔹 Started Prim’s algorithm from node ${start}`);
    return;
  }

  if (primState.finished) return log("✅ Prim’s MST complete!");

  let best = null;
  for (let e of edges) {
    const in1 = primState.inMST[e.u],
      in2 = primState.inMST[e.v];
    if (in1 ^ in2) {
      if (!best || e.w < best.w) best = e;
      e.state = "considered";
    }
  }

  if (!best) {
    primState.finished = true;
    showResult("Prim’s");
    return log("✅ MST complete (Prim).");
  }

  best.state = "selected";
  primState.inMST[best.u] = primState.inMST[best.v] = true;
  log(`🟢 Selected edge (${best.u}, ${best.v}) = ${best.w}`);
  drawGraph();
}

// 🔹 Kruskal’s Algorithm
function kruskalNextStep() {
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
    return log("✅ MST complete (Kruskal).");
  }

  const e = kruskalState.edges.shift();
  if (!e) return;

  const find = (x) =>
    kruskalState.uf[x] === x
      ? x
      : (kruskalState.uf[x] = find(kruskalState.uf[x]));
  const u = find(e.u),
    v = find(e.v);

  if (u !== v) {
    kruskalState.uf[u] = v;
    e.state = "selected";
    kruskalState.mstCount++;
    log(`🟢 Selected edge (${e.u}, ${e.v}) = ${e.w}`);
  } else {
    e.state = "rejected";
    log(`❌ Rejected edge (${e.u}, ${e.v}) = ${e.w}`);
  }

  drawGraph();
}

// 🔹 Stop Button
document.getElementById("stop").onclick = () => {
  stopFlag = true;
  log("🛑 Algorithm stopped.");
};

// 🔹 Control Buttons
document.getElementById("generate").onclick = generateGraph;
document.getElementById("next").onclick = () => {
  const algo = document.getElementById("algo").value;
  if (algo === "prim") primNextStep();
  else kruskalNextStep();
};

document.getElementById("auto").onclick = async () => {
  stopFlag = false;
  for (let i = 0; i < edges.length; i++) {
    if (stopFlag) {
      log("🛑 Auto-run stopped by user.");
      break;
    }
    const algo = document.getElementById("algo").value;
    algo === "prim" ? primNextStep() : kruskalNextStep();
    await new Promise((r) => setTimeout(r, 700));
  }
};

document.getElementById("reset").onclick = () => {
  edges.forEach((e) => (e.state = "unused"));
  primState = {};
  kruskalState = {};
  resetLog();
  drawGraph();
  document.getElementById("result").innerHTML = "";
  log("🔄 Reset done.");
};

// Initialize
generateGraph();









