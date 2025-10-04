/* app.js
   - Fetch candidate data from backend
   - Build a visual array, perform heapify (max-heap) with visual sift-down steps
   - Extract top K elements with animation
*/

let candidates = [];        // array of candidate objects
let speed = 500;            // ms between steps
let autoRun = false;

const heapContainer = document.getElementById('heapContainer');
const listContainer = document.getElementById('listContainer');
const shortlistEl = document.getElementById('shortlist');
const logEl = document.getElementById('log');

document.getElementById('genBtn').onclick = genCandidates;
document.getElementById('startBtn').onclick = startHeapSort;
document.getElementById('autoBtn').onclick = () => { autoRun = !autoRun; document.getElementById('autoBtn').innerText = autoRun ? "Auto Running..." : "Auto Run"; if(autoRun) startHeapSort(); };
document.getElementById('resetBtn').onclick = resetAll;
document.getElementById('numInput').onchange = genCandidates;
document.getElementById('speed').oninput = (e)=>{ speed = parseInt(e.target.value); document.getElementById('speedVal').innerText = speed + "ms"; }

async function genCandidates(){
  const n = parseInt(document.getElementById('numInput').value) || 12;
  const res = await fetch(`/api/candidates?n=${n}`);
  const j = await res.json();
  candidates = j.candidates;
  renderList();
  renderHeap();
  clearShortlist();
  writeLog(`Generated ${n} candidates`);
}

function renderList(){
  listContainer.innerHTML = "";
  candidates.forEach((c, idx) => {
    const r = document.createElement('div');
    r.className = 'cand-row';
    r.innerHTML = `<div class="cand-left"><div class="cand-name">${c.name} <small class="cand-meta">(${c.role})</small></div>
                   <div class="cand-meta">Exp: ${c.exp} yrs • ID: ${c.id}</div></div>
                   <div class="score-pill"> ${c.score}</div>`;
    listContainer.appendChild(r);
  });
}

function renderHeap(highlightIndex=null, extracted=[]) {
  heapContainer.innerHTML = '';
  candidates.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'node-card';
    if(i===highlightIndex) div.classList.add('heapify');
    if(extracted.includes(i)) div.classList.add('extracted');
    div.innerHTML = `<div class="id">${c.name}</div>
                     <div class="role">${c.role} • ${c.exp}y</div>
                     <div class="score">${c.score}</div>`;
    heapContainer.appendChild(div);
  });
}

// Utility: swap elements and re-render
function swap(i,j){
  const tmp = candidates[i];
  candidates[i] = candidates[j];
  candidates[j] = tmp;
}

// Heap helpers (max-heap)
async function siftDown(n, i, extractedIdxs){
  // n is heap size, i initial index
  while(true){
    let largest = i;
    const l = 2*i + 1, r = 2*i + 2;
    if(l < n && candidates[l].score > candidates[largest].score) largest = l;
    if(r < n && candidates[r].score > candidates[largest].score) largest = r;
    if(largest !== i){
      writeLog(`Sift-down: swap index ${i} (${candidates[i].score}) with ${largest} (${candidates[largest].score})`);
      swap(i, largest);
      renderHeap(largest, extractedIdxs);
      await sleep(speed);
      i = largest;
    } else break;
  }
}

async function buildMaxHeap(extractedIdxs){
  const n = candidates.length;
  writeLog("Building max heap...");
  for(let i = Math.floor(n/2)-1; i>=0; i--){
    renderHeap(i, extractedIdxs);
    await sleep(speed);
    await siftDown(n, i, extractedIdxs);
  }
  writeLog("Max heap built.");
}

async function extractTopK(k){
  const extracted = [];
  let n = candidates.length;
  for(let i=0; i<k; i++){
    if(n<=0) break;
    // swap root and last
    writeLog(`Extracting top ${i+1}: root score ${candidates[0].score}`);
    swap(0, n-1);
    extracted.push(n-1);
    renderHeap(0, extracted);
    await sleep(speed);
    // reduce heap size
    n = n-1;
    await siftDown(n, 0, extracted);
    // mark last element as extracted visually
    renderHeap(-1, extracted);
    await sleep(speed);
  }
  return extracted;
}

async function startHeapSort(){
  if(candidates.length===0){ writeLog("No candidates. Generate first."); return; }
  const k = Math.max(1, Math.min(parseInt(document.getElementById('kInput').value)||5, candidates.length));
  clearShortlist();
  writeLog(`Start shortlisting Top ${k} candidates`);
  const extractedIdxs = [];
  // Build heap
  await buildMaxHeap(extractedIdxs);
  // Extract top K
  const extracted = await extractTopK(k);
  // Compose topk list from extracted indices -> last to first because extraction puts best at end
  const topk = [];
  for(let idx of extracted){
    topk.push(candidates[idx]);
  }
  // topk is in order of extraction (best first)
  displayShortlist(topk);
  // Also call backend to show server-side shortlist (for demo)
  await fetch('/api/shortlist', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({candidates, k})
  }).then(r=>r.json()).then(j=>{
    writeLog("Backend confirmed TopK (server-side) received.");
  });
  if(autoRun) setTimeout(()=>startHeapSort(), 1200);
}

// Helpers
function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }
function writeLog(s){ logEl.textContent += "["+new Date().toLocaleTimeString()+"] " + s + "\n"; logEl.scrollTop = logEl.scrollHeight; }
function clearShortlist(){ shortlistEl.innerHTML = ''; }
function displayShortlist(arr){
  shortlistEl.innerHTML = '';
  arr.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'short-item';
    el.textContent = `${i+1}. ${c.name} • ${c.score}`;
    shortlistEl.appendChild(el);
  });
}

function resetAll(){
  candidates = [];
  heapContainer.innerHTML = '';
  listContainer.innerHTML = '';
  shortlistEl.innerHTML = '';
  logEl.textContent = '';
  autoRun = false;
  document.getElementById('autoBtn').innerText = "Auto Run";
}

// initial
genCandidates();
