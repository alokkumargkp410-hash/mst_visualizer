// script.js

// Graph data - will be generated dynamically
let graph = null;

// Global state variables
let currentAlgorithm = 'prim';
let steps = [];
let currentStep = 0;
let isPlaying = false;
let playInterval = null;
let speed = 1000;

// Generate a random graph
function generateRandomGraph() {
    const nodeCount = 6 + Math.floor(Math.random() * 3); // 6-8 nodes
    const nodes = [];
    const edges = [];
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Generate nodes in a circular layout with some randomness
    const centerX = 250;
    const centerY = 250;
    const radius = 180;
    
    for (let i = 0; i < nodeCount; i++) {
        const angle = (2 * Math.PI * i) / nodeCount;
        const randomOffset = 30;
        const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * randomOffset;
        const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * randomOffset;
        
        nodes.push({
            id: i,
            x: Math.max(60, Math.min(440, x)),
            y: Math.max(60, Math.min(440, y)),
            label: labels[i]
        });
    }
    
    // Generate edges - ensure graph is connected
    const edgeSet = new Set();
    
    // First, create a spanning tree to ensure connectivity
    const connected = [0];
    const unconnected = Array.from({ length: nodeCount - 1 }, (_, i) => i + 1);
    
    while (unconnected.length > 0) {
        const fromIdx = Math.floor(Math.random() * connected.length);
        const toIdx = Math.floor(Math.random() * unconnected.length);
        
        const from = connected[fromIdx];
        const to = unconnected[toIdx];
        
        const weight = Math.floor(Math.random() * 9) + 1;
        const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`;
        
        if (!edgeSet.has(edgeKey)) {
            edges.push({ from, to, weight });
            edgeSet.add(edgeKey);
            connected.push(to);
            unconnected.splice(toIdx, 1);
        }
    }
    
    // Add additional random edges
    const additionalEdges = Math.floor(Math.random() * 4) + 2; // 2-5 extra edges
    let attempts = 0;
    
    while (edges.length < nodeCount - 1 + additionalEdges && attempts < 50) {
        const from = Math.floor(Math.random() * nodeCount);
        const to = Math.floor(Math.random() * nodeCount);
        
        if (from !== to) {
            const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`;
            
            if (!edgeSet.has(edgeKey)) {
                const weight = Math.floor(Math.random() * 9) + 1;
                edges.push({ from, to, weight });
                edgeSet.add(edgeKey);
            }
        }
        attempts++;
    }
    
    return { nodes, edges };
}

// Initialize with default or random graph
function initializeGraph() {
    graph = {
        nodes: [
            { id: 0, x: 150, y: 100, label: 'A' },
            { id: 1, x: 350, y: 100, label: 'B' },
            { id: 2, x: 450, y: 250, label: 'C' },
            { id: 3, x: 350, y: 400, label: 'D' },
            { id: 4, x: 150, y: 400, label: 'E' },
            { id: 5, x: 50, y: 250, label: 'F' },
        ],
        edges: [
            { from: 0, to: 1, weight: 4 },
            { from: 0, to: 5, weight: 2 },
            { from: 1, to: 2, weight: 5 },
            { from: 1, to: 5, weight: 3 },
            { from: 2, to: 3, weight: 1 },
            { from: 2, to: 4, weight: 6 },
            { from: 3, to: 4, weight: 3 },
            { from: 4, to: 5, weight: 7 },
            { from: 1, to: 3, weight: 8 },
        ]
    };
}

// Generate new random graph
function generateNewGraph() {
    if (isPlaying) togglePlay();
    graph = generateRandomGraph();
    steps = currentAlgorithm === 'prim' ? generatePrimSteps() : generateKruskalSteps();
    currentStep = 0;
    render();
}

// Generate steps for Prim's Algorithm
function generatePrimSteps() {
    const stepsData = [];
    const n = graph.nodes.length;
    const visited = new Array(n).fill(false);
    const mstEdges = [];
    const pq = [];

    stepsData.push({
        description: `Start: Select node ${graph.nodes[0].label} as starting vertex`,
        visited: [0],
        mstEdges: [],
        currentEdge: null,
        pq: [],
    });

    visited[0] = true;
    const visitedSet = [0];

    graph.edges.forEach(e => {
        if (e.from === 0) pq.push({ ...e });
        if (e.to === 0) pq.push({ from: e.to, to: e.from, weight: e.weight });
    });
    pq.sort((a, b) => a.weight - b.weight);

    stepsData.push({
        description: `Priority Queue: Add edges from ${graph.nodes[0].label} to queue`,
        visited: [...visitedSet],
        mstEdges: [...mstEdges],
        currentEdge: null,
        pq: pq.map(e => `${graph.nodes[e.from].label}-${graph.nodes[e.to].label}(${e.weight})`),
    });

    while (pq.length > 0 && mstEdges.length < n - 1) {
        const edge = pq.shift();
        
        if (visited[edge.to]) {
            stepsData.push({
                description: `Skip edge ${graph.nodes[edge.from].label}-${graph.nodes[edge.to].label}: Creates cycle`,
                visited: [...visitedSet],
                mstEdges: [...mstEdges],
                currentEdge: edge,
                pq: pq.map(e => `${graph.nodes[e.from].label}-${graph.nodes[e.to].label}(${e.weight})`),
                rejected: true,
            });
            continue;
        }

        mstEdges.push(edge);
        visited[edge.to] = true;
        visitedSet.push(edge.to);

        stepsData.push({
            description: `Select edge ${graph.nodes[edge.from].label}-${graph.nodes[edge.to].label} (weight: ${edge.weight})`,
            visited: [...visitedSet],
            mstEdges: [...mstEdges],
            currentEdge: edge,
            pq: pq.map(e => `${graph.nodes[e.from].label}-${graph.nodes[e.to].label}(${e.weight})`),
        });

        graph.edges.forEach(e => {
            if (e.from === edge.to && !visited[e.to]) {
                pq.push({ ...e });
            }
            if (e.to === edge.to && !visited[e.from]) {
                pq.push({ from: e.to, to: e.from, weight: e.weight });
            }
        });
        pq.sort((a, b) => a.weight - b.weight);

        stepsData.push({
            description: `Add edges from ${graph.nodes[edge.to].label} to queue`,
            visited: [...visitedSet],
            mstEdges: [...mstEdges],
            currentEdge: null,
            pq: pq.map(e => `${graph.nodes[e.from].label}-${graph.nodes[e.to].label}(${e.weight})`),
        });
    }

    const totalWeight = mstEdges.reduce((sum, e) => sum + e.weight, 0);
    stepsData.push({
        description: `Complete! Total MST weight: ${totalWeight}`,
        visited: visitedSet,
        mstEdges: [...mstEdges],
        currentEdge: null,
        pq: [],
        complete: true,
    });

    return stepsData;
}

// Generate steps for Kruskal's Algorithm
function generateKruskalSteps() {
    const stepsData = [];
    const n = graph.nodes.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = new Array(n).fill(0);
    const mstEdges = [];

    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }

    function union(x, y) {
        const px = find(x);
        const py = find(y);
        if (px === py) return false;
        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
        return true;
    }

    const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);

    stepsData.push({
        description: "Start: Sort all edges by weight",
        mstEdges: [],
        currentEdge: null,
        disjointSets: parent.map((p, i) => `{${graph.nodes[i].label}}`),
        visited: [],
    });

    for (const edge of sortedEdges) {
        const setFrom = find(edge.from);
        const setTo = find(edge.to);

        if (setFrom === setTo) {
            stepsData.push({
                description: `Skip edge ${graph.nodes[edge.from].label}-${graph.nodes[edge.to].label}: Creates cycle`,
                mstEdges: [...mstEdges],
                currentEdge: edge,
                disjointSets: Array.from(new Set(parent.map(find))).map(root => {
                    const members = parent.map((p, i) => find(i) === root ? graph.nodes[i].label : null).filter(Boolean);
                    return `{${members.join(',')}}`;
                }),
                rejected: true,
                visited: [],
            });
            continue;
        }

        union(edge.from, edge.to);
        mstEdges.push(edge);

        stepsData.push({
            description: `Select edge ${graph.nodes[edge.from].label}-${graph.nodes[edge.to].label} (weight: ${edge.weight})`,
            mstEdges: [...mstEdges],
            currentEdge: edge,
            disjointSets: Array.from(new Set(parent.map(find))).map(root => {
                const members = parent.map((p, i) => find(i) === root ? graph.nodes[i].label : null).filter(Boolean);
                return `{${members.join(',')}}`;
            }),
            visited: [],
        });

        if (mstEdges.length === n - 1) break;
    }

    const totalWeight = mstEdges.reduce((sum, e) => sum + e.weight, 0);
    stepsData.push({
        description: `Complete! Total MST weight: ${totalWeight}`,
        mstEdges: [...mstEdges],
        currentEdge: null,
        disjointSets: [`{${graph.nodes.map(n => n.label).join(',')}}`],
        complete: true,
        visited: [],
    });

    return stepsData;
}

// Change algorithm (Prim's or Kruskal's)
function changeAlgorithm(algo) {
    if (isPlaying) togglePlay();
    currentAlgorithm = algo;
    
    document.querySelectorAll('.btn-algo').forEach(btn => {
        btn.classList.remove('active-prim', 'active-kruskal');
    });
    event.target.classList.add(algo === 'prim' ? 'active-prim' : 'active-kruskal');
    
    document.getElementById('algoTitle').textContent = algo === 'prim' ? "Prim's Algorithm" : "Kruskal's Algorithm";
    document.getElementById('queueSection').style.display = algo === 'prim' ? 'block' : 'none';
    document.getElementById('setsSection').style.display = algo === 'kruskal' ? 'block' : 'none';
    document.getElementById('progressFill').className = `progress-fill ${algo}`;
    
    steps = algo === 'prim' ? generatePrimSteps() : generateKruskalSteps();
    currentStep = 0;
    render();
}

// Toggle play/pause
function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playIcon').style.display = isPlaying ? 'none' : 'block';
    document.getElementById('pauseIcon').style.display = isPlaying ? 'block' : 'none';
    
    if (isPlaying) {
        playInterval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                render();
            } else {
                togglePlay();
            }
        }, speed);
    } else {
        clearInterval(playInterval);
    }
}

// Reset to first step
function reset() {
    if (isPlaying) togglePlay();
    currentStep = 0;
    render();
}

// Go to next step
function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        render();
    }
}

// Change animation speed
function changeSpeed(value) {
    speed = parseInt(value);
    document.getElementById('speedLabel').textContent = ((2200 - speed) / 200) + 'x';
    if (isPlaying) {
        clearInterval(playInterval);
        playInterval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                render();
            } else {
                togglePlay();
            }
        }, speed);
    }
}

// Render current step
function render() {
    const step = steps[currentStep];
    const canvas = document.getElementById('canvas');
    
    document.getElementById('stepInfo').textContent = `Step ${currentStep + 1} of ${steps.length}`;
    document.getElementById('progressFill').style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    document.getElementById('nextBtn').disabled = currentStep >= steps.length - 1;
    
    const descBox = document.getElementById('stepDescription');
    descBox.querySelector('p').textContent = step.description;
    descBox.className = 'info-box';
    if (step.complete) descBox.classList.add('complete');
    if (step.rejected) descBox.classList.add('rejected');
    
    if (currentAlgorithm === 'prim' && step.pq) {
        const queueList = document.getElementById('queueList');
        queueList.innerHTML = step.pq.length > 0 
            ? step.pq.map(e => `<div>${e}</div>`).join('')
            : '<div class="empty">Empty</div>';
    }
    
    if (currentAlgorithm === 'kruskal' && step.disjointSets) {
        const setsList = document.getElementById('setsList');
        setsList.innerHTML = step.disjointSets.map(s => `<div>${s}</div>`).join('');
    }
    
    const edgesList = document.getElementById('edgesList');
    if (step.mstEdges.length > 0) {
        const totalWeight = step.mstEdges.reduce((sum, e) => sum + e.weight, 0);
        edgesList.innerHTML = step.mstEdges.map(e => 
            `<div>${graph.nodes[e.from].label} - ${graph.nodes[e.to].label} (${e.weight})</div>`
        ).join('') + `<div class="total-weight">Total: ${totalWeight}</div>`;
    } else {
        edgesList.innerHTML = '<div class="empty">None yet</div>';
    }
    
    canvas.innerHTML = '';
    
    graph.edges.forEach(edge => {
        const from = graph.nodes[edge.from];
        const to = graph.nodes[edge.to];
        
        const isInMST = step.mstEdges.some(
            e => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from)
        );
        const isCurrent = step.currentEdge && 
            ((step.currentEdge.from === edge.from && step.currentEdge.to === edge.to) ||
             (step.currentEdge.from === edge.to && step.currentEdge.to === edge.from));
        const isRejected = step.rejected && isCurrent;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('stroke', isRejected ? '#ef4444' : isInMST ? '#22c55e' : isCurrent ? '#fbbf24' : '#475569');
        line.setAttribute('stroke-width', isInMST || isCurrent ? '4' : '2');
        canvas.appendChild(line);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (from.x + to.x) / 2);
        text.setAttribute('y', (from.y + to.y) / 2 - 5);
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = edge.weight;
        canvas.appendChild(text);
    });
    
    graph.nodes.forEach((node, i) => {
        const isVisited = step.visited && step.visited.includes(i);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', '25');
        circle.setAttribute('fill', isVisited ? (currentAlgorithm === 'prim' ? '#3b82f6' : '#a855f7') : '#1e293b');
        circle.setAttribute('stroke', isVisited ? '#fff' : '#475569');
        circle.setAttribute('stroke-width', '3');
        canvas.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 6);
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '18');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = node.label;
        canvas.appendChild(text);
    });
}

// Initialize on page load
initializeGraph();
steps = generatePrimSteps();
render();

