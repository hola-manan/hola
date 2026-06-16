"use strict";

const $ = (sel) => document.querySelector(sel);

const state = { threadId: null, busy: false };

/* ---------- tiny markdown renderer (no external deps) ---------- */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function renderMarkdown(src) {
  const lines = esc(src || "").split("\n");
  let html = "";
  let i = 0;
  let listType = null;
  const closeList = () => {
    if (listType) { html += `</${listType}>`; listType = null; }
  };
  const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    // table
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:\-|]+\|\s*$/.test(lines[i + 1])) {
      closeList();
      const header = line;
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
      html += "<table><thead><tr>" + cells(header).map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>";
      rows.forEach((r) => { html += "<tr>" + cells(r).map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>"; });
      html += "</tbody></table>";
      continue;
    }
    let m;
    if (/^\s*$/.test(line)) { closeList(); i++; continue; }
    if (/^---+\s*$/.test(line)) { closeList(); html += "<hr>"; i++; continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { closeList(); const l = m[1].length; html += `<h${l}>${inline(m[2])}</h${l}>`; i++; continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; } html += `<li>${inline(m[1])}</li>`; i++; continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; } html += `<li>${inline(m[1])}</li>`; i++; continue; }
    closeList();
    html += `<p>${inline(line)}</p>`;
    i++;
  }
  closeList();
  return html;
}

/* ---------- rendering ---------- */
function renderStages(stages) {
  const ol = $("#stages");
  ol.innerHTML = "";
  const firstPendingIdx = stages.findIndex((s) => !s.done);
  stages.forEach((s, idx) => {
    const li = document.createElement("li");
    li.className = "stage";
    if (s.done) li.classList.add("is-done", "is-open");
    else if (idx === firstPendingIdx && state.busy) li.classList.add("is-active");
    const label = s.done ? "Done" : (idx === firstPendingIdx && state.busy ? "Working…" : "Pending");
    li.innerHTML = `
      <div class="stage__head" role="button" tabindex="0" aria-expanded="${s.done}">
        <span class="stage__num">${idx + 1}</span>
        <span class="stage__title">${s.title}</span>
        <span class="stage__state">${label}</span>
      </div>
      <div class="stage__body"><div class="md">${s.done ? renderMarkdown(s.content) : "<p style='color:#888'>Not generated yet.</p>"}</div></div>`;
    const head = li.querySelector(".stage__head");
    const toggle = () => {
      li.classList.toggle("is-open");
      head.setAttribute("aria-expanded", li.classList.contains("is-open"));
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    ol.appendChild(li);
  });
}

function setBusy(on, msg) {
  state.busy = on;
  $("#startBtn").disabled = on;
  $("#submitBtn").disabled = on;
  const st = $("#status");
  st.textContent = msg || "";
  st.classList.toggle("is-busy", on);
}

function handleResponse(data) {
  state.threadId = data.thread_id;
  renderStages(data.stages);
  const interrupt = $("#interrupt");
  const done = $("#done");
  if (data.status === "interrupt") {
    $("#interruptPrompt").textContent = data.prompt;
    interrupt.hidden = false;
    done.hidden = true;
    $("#answer").value = "";
    $("#answer").focus();
    setBusy(false, "Waiting for your input.");
  } else {
    interrupt.hidden = true;
    done.hidden = false;
    $("#donePath").textContent = data.saved_path ? `Saved to: ${data.saved_path}` : "";
    setBusy(false, "Complete.");
  }
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/* ---------- events ---------- */
async function onStart() {
  const idea = $("#idea").value.trim();
  const mode = $("#mode").value;
  if (mode === "auto" && !idea) { setBusy(false, "Please enter a product idea."); return; }
  $("#interrupt").hidden = true;
  $("#done").hidden = true;
  setBusy(true, mode === "auto" ? "Generating all seven stages…" : "Starting…");
  try {
    const data = await postJSON("/api/start", { idea, style: $("#style").value || null, mode });
    handleResponse(data);
  } catch (e) {
    setBusy(false, `Error: ${e.message}`);
  }
}

async function onSubmit() {
  if (!state.threadId) return;
  const answer = $("#answer").value.trim();
  setBusy(true, "Processing…");
  try {
    const data = await postJSON("/api/resume", { thread_id: state.threadId, answer });
    handleResponse(data);
  } catch (e) {
    setBusy(false, `Error: ${e.message}`);
  }
}

async function init() {
  $("#year").textContent = new Date().getFullYear();
  try {
    const meta = await (await fetch("/api/meta")).json();
    $("#modelBadge").textContent = `model: ${meta.model}${meta.fake ? " (offline demo)" : ""}`;
  } catch { $("#modelBadge").textContent = "model: unavailable"; }
  try {
    const styles = await (await fetch("/api/styles")).json();
    const sel = $("#style");
    styles.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = s.title;
      sel.appendChild(opt);
    });
  } catch { /* leave default option */ }
  // empty placeholder stepper
  renderStages([
    { title: "Discovery interview", done: false, content: "" },
    { title: "Answers & gap resolution", done: false, content: "" },
    { title: "PRD draft", done: false, content: "" },
    { title: "Adversarial pressure-test", done: false, content: "" },
    { title: "Completeness sweep", done: false, content: "" },
    { title: "Audience summaries", done: false, content: "" },
    { title: "Final PRD", done: false, content: "" },
  ]);
  $("#startBtn").addEventListener("click", onStart);
  $("#submitBtn").addEventListener("click", onSubmit);
}

init();
