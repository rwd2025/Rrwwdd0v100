const $ = id => document.getElementById(id);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const fmtMoney = n => `$${Number(n||0).toFixed(2)}`;

const RWD = {
  safeJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  },
  save(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
  settings(){
    return this.safeJson("RWD_SETTINGS", {
      companyName:"Rolling Wrench Diesel",
      companyPhone:"260-502-6222",
      companyWebsite:"www.rollingwrenchdiesel.com",
      laborRate:135,
      tax:0,
      squareLink:"https://squareup.com/dashboard"
    });
  }
};

const Modules = [
  ["VIN Lookup","Decode / save truck","truck","🔎"],["OEM Parts","Parts + cross refs","parts","⚙"],["Fault Doctor","SPN/FMI workflow","faults","⚕"],["Repair HUD","Procedures + memory","repair","🛠"],["Smart Quotes","Build estimate","invoice","▣"],
  ["Work Orders","Job workflow","clock","▤"],["Invoices","Paper bill","invoice","▥"],["Time Clock","3 live jobs","clock","◷"],["Camera / OCR","Scan VIN / part","scan","📷"],["Pin Drop","Broken truck location","gps","📍"],
  ["Repair Memory","Saved fixes","repair","🧠"],["Suppliers","FleetPride etc.","suppliers","◆"],["AI Assistant","Master command","ai-full","RW"],["Reports","Income + labor","reports","▥"],["Settings","Themes / debug","settings","⚙"],["Emergency","Roadside flow","faults","⚠"]
];


/* =========================================================
   RWD MODULE REGISTRY — V3 MASTER MODULE INTERIORS
   Centralized module-specific UI. No cheap placeholder pages.
   ========================================================= */
const RWDModuleRegistry = {
  faults: {
    title: "Fault Doctor",
    render: () => `
      <div class="pro-panel diag-panel">
        <div class="pro-header"><h3>DIAGNOSTIC HUD</h3><span class="status-pill">ONLINE</span></div>
        <div class="pro-grid-2">
          <label class="pro-label">SPN / FMI / CODE<input id="spnInput" class="pro-input" placeholder="Example: SPN 3251 FMI 2"></label>
          <label class="pro-label">SYMPTOM<input id="symptomInput" class="pro-input" placeholder="Derate, regen fail, no start..."></label>
        </div>
        <div class="nav-grid">
          <button class="pro-btn-sub" onclick="RWDModuleActions.quickFault('DPF differential pressure: inspect tubes, sensor, soot load, regen status.')">DPF / AFTERTREATMENT</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.quickFault('Fuel rail: verify pressure command vs actual, leaks, return flow, wiring.')">FUEL SYSTEM</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.quickFault('EGR: inspect valve sweep, delta P, cooler restriction, wiring.')">EGR / AIR</button>
        </div>
        <button class="pro-btn-gold" onclick="RWDModuleActions.runFault()">RUN DIAGNOSTIC TREE</button>
        <div id="diagResults" class="view-area">Awaiting fault code entry. Active truck context will be attached.</div>
      </div>`
  },

  repair: {
    title: "Repair HUD",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>REPAIR HUD</h3><span class="status-pill">PROCEDURE MODE</span></div>
        <div class="nav-grid">
          <button class="pro-btn-sub" onclick="RWDModuleActions.repairView('Torque Specs', 'Torque specs viewer shell. Backend/manual database plugs in here.')">TORQUE SPECS</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.repairView('Safety', 'Lockout, hot exhaust, high pressure fuel, lifting, burn hazards.')">SAFETY</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.repairView('Checklist', 'Complaint / Cause / Correction checklist ready.')">CHECKLIST</button>
        </div>
        <textarea class="pro-textarea" id="repairQuestion" placeholder="Ask procedure question or paste repair notes..."></textarea>
        <button class="pro-btn-gold" onclick="RWDModuleActions.saveRepairNote()">SAVE TO REPAIR MEMORY</button>
        <div class="view-area" id="repairViewer">Select a procedure area or save repair notes.</div>
      </div>`
  },

  parts: {
    title: "OEM Parts",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>OEM PARTS COMMAND</h3><span class="status-pill">VIN CONTEXT</span></div>
        <div class="pro-grid-2">
          <label class="pro-label">PART # / DESCRIPTION<input id="partsSearchInput" class="pro-input" placeholder="Filter, sensor, Bendix, Fleetguard..."></label>
          <label class="pro-label">JOB<select id="partsJobSelect" class="pro-input"><option value="job1">Job 1</option><option value="job2">Job 2</option><option value="job3">Job 3</option></select></label>
        </div>
        <div class="nav-grid">
          <button class="pro-btn-sub" onclick="RWDModuleActions.partsSearch('cross')">CROSS REF</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.partsSearch('kit')">SMART KIT</button>
          <button class="pro-btn-sub" onclick="RWDModuleActions.openSupplierSearch()">SUPPLIERS</button>
        </div>
        <button class="pro-btn-gold" onclick="RWDModuleActions.partsSearch('search')">SEARCH / VERIFY</button>
        <div id="partsResultArea" class="view-area">Enter a part number or description. Live supplier pricing needs backend/vendor lookup.</div>
      </div>`
  },

  truck: {
    title: "VIN Lookup",
    render: null
  },

  workorders: {
    title: "Work Orders",
    render: () => `
      <div class="pro-panel workorder-panel">
        <div class="pro-header"><h3>REPAIR ORDER COMMAND</h3><span class="status-pill">CCC READY</span></div>
        <div class="wo-status-row">
          <button onclick="RWDModuleActions.fillWorkOrderTest()">TEST FILL</button>
          <button onclick="RWDModuleActions.clearWorkOrderForm()">CLEAR</button>
          <button onclick="NavigationManager.navigate('invoice')">TO INVOICE</button>
        </div>
        <div class="pro-grid-2">
          <label class="pro-label">Customer / Unit<input id="woCustomer" class="pro-input" placeholder="Customer / unit number"></label>
          <label class="pro-label">Truck / Last 8 VIN<input id="woTruck" class="pro-input" placeholder="Truck / last 8 VIN"></label>
          <label class="pro-label">Service Type<select id="woServiceType" class="pro-input"><option>In-House</option><option>Mobile Service Call</option><option>Emergency Roadside</option></select></label>
          <label class="pro-label">Status<select id="woStatus" class="pro-input"><option>New</option><option>Diagnosing</option><option>Waiting Parts</option><option>In Progress</option><option>Complete</option><option>Invoiced</option></select></label>
        </div>
        <label class="pro-label">Complaint<textarea id="woComplaint" class="pro-textarea" placeholder="Customer complaint..."></textarea></label>
        <label class="pro-label">Cause<textarea id="woCause" class="pro-textarea" placeholder="Found cause..."></textarea></label>
        <label class="pro-label">Correction<textarea id="woCorrection" class="pro-textarea" placeholder="Repair correction..."></textarea></label>
        <label class="pro-label">Tech Notes / Recommendations<textarea id="woNotes" class="pro-textarea" placeholder="Notes, photos, job kit, parts needed, follow-up recommendations..."></textarea></label>
        <div class="wo-status-row">
          <button onclick="RWDModuleActions.saveWorkOrder()">SAVE RO</button>
          <button onclick="RWDModuleActions.copyWorkOrder()">COPY TEXT</button>
          <button onclick="NavigationManager.navigate('parts')">PARTS LOOKUP</button>
        </div>
        <div class="view-area" id="woOutput">Repair order ready. This is a professional work order screen, not the clock.</div>
      </div>`
  },

  reports: {
    title: "Reports",
    render: () => `
      <div class="pro-panel reports-panel">
        <div class="pro-header"><h3>REPORTS / ANALYTICS</h3><span class="status-pill">LOCAL LEDGER</span></div>
        <div class="report-metrics report-metrics-pro">
          <button onclick="NavigationManager.navigate('invoice')"><span>Open Invoice</span><strong id="reportInvoice">$0.00</strong></button>
          <button onclick="NavigationManager.navigate('finance')"><span>Finance Records</span><strong id="reportRecords">0</strong></button>
          <button onclick="NavigationManager.navigate('clock')"><span>Labor</span><strong id="reportLabor">$0.00</strong></button>
        </div>
        <div class="report-dashboard-grid">
          <div class="report-card"><b>Unpaid / Pending</b><span id="reportPending">$0.00</span><small>Quotes and invoices waiting payment.</small></div>
          <div class="report-card"><b>Tax Estimate</b><span id="reportTax">$0.00</span><small>Based on stored invoice tax data.</small></div>
          <div class="report-card"><b>Parts / Supplies</b><span id="reportParts">$0.00</span><small>Parts ledger + shop consumables.</small></div>
          <div class="report-card"><b>Jobs Today</b><span id="reportJobs">3</span><small>Current local job clock slots.</small></div>
        </div>
        <div class="report-actions">
          <button onclick="RWDModuleActions.refreshReports()">REFRESH REPORTS</button>
          <button onclick="NavigationManager.navigate('debug')">DEBUG DATA</button>
          <button onclick="RWDModuleActions.copyReportSummary()">COPY SUMMARY</button>
        </div>
        <div class="view-area clean-report-output" id="reportsArea">Reports are ready. Raw JSON is now inside Debug only.</div>
      </div>`
  },

  finance: {
    title: "Finance Ledger",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>FINANCE LEDGER</h3><span class="status-pill">TAX READY SHELL</span></div>
        <button class="pro-btn-gold" onclick="FinanceManager.render()">REFRESH LEDGER</button>
        <div class="view-area"><pre id="financeOut">No records yet.</pre></div>
      </div>`
  },

  suppliers: {
    title: "Suppliers",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>SUPPLIER COMMAND</h3><span class="status-pill">MAPS READY</span></div>
        <div class="nav-grid">
          <button class="pro-btn-sub" onclick="window.open('https://www.google.com/maps/search/FleetPride+near+me','_blank')">FLEETPRIDE</button>
          <button class="pro-btn-sub" onclick="window.open('https://www.google.com/maps/search/heavy+duty+truck+parts+near+me','_blank')">HD PARTS</button>
          <button class="pro-btn-sub" onclick="window.open('https://www.google.com/maps/search/Cummins+dealer+near+me','_blank')">CUMMINS</button>
        </div>
        <div class="view-area">Supplier search opens maps now. Live inventory/pricing plugs into backend later.</div>
      </div>`
  },

  memory: {
    title: "Repair Memory",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>REPAIR MEMORY</h3><span class="status-pill">LOCAL</span></div>
        <textarea id="memoryNote" class="pro-textarea" placeholder="Save known fix, VIN note, part note, or diagnostic result..."></textarea>
        <button class="pro-btn-gold" onclick="RWDModuleActions.saveMemory()">SAVE MEMORY</button>
        <div class="view-area" id="memoryOutput">${JSON.stringify(RWD.safeJson('RWD_MEMORY', []), null, 2)}</div>
      </div>`
  },

  emergency: {
    title: "Emergency Roadside",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>ROADSIDE COMMAND</h3><span class="status-pill">READY</span></div>
        <div class="nav-grid">
          <button class="pro-btn-sub" onclick="NavigationManager.navigate('clock')">START JOB</button>
          <button class="pro-btn-sub" onclick="NavigationManager.navigate('invoice')">BILLING</button>
          <button class="pro-btn-sub" onclick="NavigationManager.navigate('gps')">GPS</button>
        </div>
        <div class="view-area">Roadside workflow shell: dispatch, ETA, callout fee, GPS, parts, and invoice.</div>
      </div>`
  },

  gps: {
    title: "Pin Drop",
    render: () => `
      <div class="pro-panel">
        <div class="pro-header"><h3>Pin Drop</h3><span class="status-pill">ROAD CALL READY</span></div>
        <button class="pro-btn-gold" onclick="window.open('https://www.google.com/maps/search/heavy+duty+truck+parts+near+me','_blank')">PIN BROKEN TRUCK</button>
        <div class="view-area">Pin the broken-down truck, copy location, open maps, and start roadside workflow.</div>
      </div>`
  }
};

const RWDModuleActions = {
  runFault(){
    const code = $("spnInput")?.value || "No code entered";
    const symptom = $("symptomInput")?.value || "No symptom entered";
    $("diagResults").innerHTML = `<b>Diagnostic Tree Ready</b><br>Code: ${escapeHtml(code)}<br>Symptom: ${escapeHtml(symptom)}<br><br>Next checks: verify power/ground, inspect connector, compare commanded vs actual, check related components, save confirmed fix to Repair Memory.`;
  },
  quickFault(text){ $("diagResults").textContent = text; },
  repairView(title, body){ $("repairViewer").innerHTML = `<b>${escapeHtml(title)}</b><br>${escapeHtml(body)}`; },
  saveRepairNote(){
    const note = $("repairQuestion")?.value || "";
    if(!note.trim()) return showToast("Enter repair note");
    const mem = RWD.safeJson("RWD_MEMORY", []);
    mem.push({type:"repair", note, truck:TruckManager.get(), date:new Date().toISOString()});
    RWD.save("RWD_MEMORY", mem);
    $("repairViewer").textContent = "Saved to Repair Memory.";
    showToast("Repair memory saved");
  },
  partsSearch(mode){
    const q = $("partsSearchInput")?.value || "";
    $("partsResultArea").innerHTML = `<b>${mode.toUpperCase()} READY</b><br>Query: ${escapeHtml(q)}<br>Active VIN: ${escapeHtml(TruckManager.get().vin || "NONE")}<br><br>Backend supplier/OEM verification plugs in here.<br>${JobKitsManager.render(q)}`;
  },
  openSupplierSearch(){
    const q = $("partsSearchInput")?.value || "heavy duty truck parts";
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q + " near me")}`, "_blank");
  },
  saveWorkOrder(){
    const wo = {
      complaint:$("woComplaint")?.value || "",
      cause:$("woCause")?.value || "",
      correction:$("woCorrection")?.value || "",
      truck:TruckManager.get(),
      date:new Date().toISOString()
    };
    const list = RWD.safeJson("RWD_WORKORDERS", []);
    list.push(wo);
    RWD.save("RWD_WORKORDERS", list);
    $("woOutput").textContent = JSON.stringify(wo, null, 2);
    showToast("Work order saved");
  },

  refreshReports(){
    const finance = RWD.safeJson("RWD_FINANCE", []);
    const inv = RWD.safeJson("RWD_ACTIVE_INVOICE", null);
    let labor = 0;
    Object.keys(JobClockManager.jobs || {}).forEach(id => labor += Number(JobClockManager.getJobSummary(id).dollars || 0));
    const records = finance.length;
    const invoiceTotal = inv ? Number(inv.total || 0) : 0;
    const taxTotal = inv ? Number(inv.tax || 0) : 0;
    const partsTotal = inv && Array.isArray(inv.parts) ? inv.parts.reduce((s,p)=>s+Number(p.lineTotal||0),0) : 0;
    if($("reportLabor")) $("reportLabor").textContent = fmtMoney(labor);
    if($("reportRecords")) $("reportRecords").textContent = records;
    if($("reportInvoice")) $("reportInvoice").textContent = fmtMoney(invoiceTotal);
    if($("reportPending")) $("reportPending").textContent = fmtMoney(invoiceTotal);
    if($("reportTax")) $("reportTax").textContent = fmtMoney(taxTotal);
    if($("reportParts")) $("reportParts").textContent = fmtMoney(partsTotal + Number(inv?.shopSupplies || 0));
    if($("reportJobs")) $("reportJobs").textContent = Object.keys(JobClockManager.jobs || {}).length;
    if($("reportsArea")) $("reportsArea").innerHTML = `<b>Report refreshed.</b><br>Labor: ${fmtMoney(labor)}<br>Open Invoice: ${fmtMoney(invoiceTotal)}<br>Finance Records: ${records}<br><br>Use DEBUG DATA for raw state.`;
  },
  copyReportSummary(){
    const txt = `RWD Report Summary
Labor: ${$("reportLabor")?.textContent || "$0.00"}
Open Invoice: ${$("reportInvoice")?.textContent || "$0.00"}
Finance Records: ${$("reportRecords")?.textContent || "0"}`;
    navigator.clipboard?.writeText(txt);
    showToast("Report summary copied");
  },
  saveMemory(){
    const note = $("memoryNote")?.value || "";
    if(!note.trim()) return showToast("Enter memory note");
    const mem = RWD.safeJson("RWD_MEMORY", []);
    mem.push({type:"manual", note, truck:TruckManager.get(), date:new Date().toISOString()});
    RWD.save("RWD_MEMORY", mem);
    $("memoryOutput").textContent = JSON.stringify(mem, null, 2);
    showToast("Memory saved");
  }
};

const NavigationManager = {
  current:"home",
  history:[],
  init(){
    document.addEventListener("click", e => {
      const nav = e.target.closest("[data-nav]");
      if(nav){
        e.preventDefault();
        this.navigate(nav.dataset.nav);
        return;
      }
      const action = e.target.closest("[data-action]");
      if(action){
        e.preventDefault();
        Actions.run(action.dataset.action, action);
      }
    });
  },
  navigate(id, opts={}){
    id = HomeRouteAlias.resolve(id);
    const mod = (typeof RWDModuleRegistry !== "undefined") ? RWDModuleRegistry[id] : null;
    const target = $(id) || $("generic");
    if(!opts.skipHistory && this.current && this.current !== id){
      this.history.push(this.current);
      if(this.history.length > 25) this.history.shift();
    }

    if(mod && mod.title){
      const titleEl = target.querySelector(".screen-title");
      if(titleEl) titleEl.textContent = mod.title;
    }

    if(mod && typeof mod.render === "function"){
      const card = target.querySelector(".generic-card");
      if(card) card.innerHTML = mod.render();
    }

    qsa(".screen").forEach(s => s.classList.toggle("active", s === target));
    qsa(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.nav === id));
    $("sideMenu")?.classList.remove("open");
    this.current = id;
    ScreenControls.refresh(id);
    window.scrollTo({top:0, behavior:"smooth"});

    if(id === "finance") FinanceManager.render();
    if(id === "reports" && typeof RWDModuleActions !== "undefined") setTimeout(()=>RWDModuleActions.refreshReports(), 0);
    if(id === "gps") setTimeout(()=>GpsModule.render(),0);
    if(id === "debug") DebugPanel.refresh();
  }
};

const ThemeManager = {
  themes:[["elite","Command Center"],["industrial","Industrial Flight"],["night","Night Ops"],["heavy","Heavy Duty"],["warroom","AI War Room"],["recovery","Roadside Recovery"],["blackout","Premium Blackout"],["oem","OEM Master Tech"],["titanium","Titanium Grid"],["ultimate","Ultimate Gold"]],
  init(){
    document.body.dataset.theme = localStorage.getItem("RWD_THEME") || "ultimate";
    this.render();
    this.setGhost();
  },
  render(){
    const grid = $("themeGrid");
    if(!grid) return;
    grid.innerHTML = this.themes.map(([key,label]) => `<button class="theme-pill ${document.body.dataset.theme===key?'active':''}" data-theme="${key}">${label}</button>`).join("");
    grid.querySelectorAll("[data-theme]").forEach(btn => btn.addEventListener("click", () => this.apply(btn.dataset.theme)));
  },
  apply(theme){
    document.body.dataset.theme = theme;
    localStorage.setItem("RWD_THEME", theme);
    this.render();
    this.setGhost();
  },
  setGhost(){
    const bg = $("engineGhost");
    if(!bg) return;
    const color = getComputedStyle(document.body).getPropertyValue("--accent-main").trim() || "#f59e0b";
    const label = TruckManager.get().engine || "Cummins X15";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900' viewBox='0 0 900 900'><rect width='900' height='900' fill='none'/><g fill='none' stroke='${color}' stroke-width='14' opacity='.72'><path d='M160 520h120v-90h70v-85h260v85h90v90h-78v92H238v-92z'/><path d='M250 340h110v-85h280v85M310 610v75M420 610v75M530 610v75M640 610v75M340 430h230M340 500h310M190 520v-70l-55-35v-95h95l50 70M710 518l58-35v-90l-58-34'/><circle cx='260' cy='720' r='44'/><circle cx='640' cy='720' r='44'/></g><text x='450' y='162' text-anchor='middle' font-family='Arial Black' font-size='62' fill='${color}' opacity='.38'>${label.toUpperCase()}</text></svg>`;
    bg.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
};

const TruckManager = {
  get(){ return RWD.safeJson("RWD_TRUCK", {vin:"NONE", year:"", make:"", model:"", engine:"Cummins X15", esn:"", cpl:"", odometer:""}); },
  saveFromForm(){
    const t = {vin:$("vinGlobal").value.trim().toUpperCase() || "NONE", year:$("yearGlobal").value, make:$("makeGlobal").value, model:$("modelGlobal").value, engine:$("engineGlobal").value, esn:$("esnGlobal").value, cpl:$("cplGlobal").value, odometer:$("odometerGlobal").value};
    RWD.save("RWD_TRUCK", t);
    this.apply(t);
    ThemeManager.setGhost();
    showToast("Truck saved");
  },
  clear(){
    localStorage.removeItem("RWD_TRUCK");
    ["vinGlobal","yearGlobal","makeGlobal","modelGlobal","esnGlobal","cplGlobal","odometerGlobal"].forEach(id => { if($(id)) $(id).value=""; });
    if($("engineGlobal")) $("engineGlobal").value="Cummins X15";
    this.apply(this.get());
    showToast("Truck cleared");
  },
  apply(t=this.get()){
    $("stripVin").textContent = t.vin || "NONE";
    $("stripEngine").textContent = (t.engine || "Cummins X15").toUpperCase();
    $("heroVin").textContent = t.vin || "NONE";
    $("heroEngine").textContent = (t.engine || "Cummins X15").toUpperCase();
    $("heroCpl").textContent = t.cpl || "----";
    $("heroOdo").textContent = t.odometer ? `${t.odometer} mi` : "----";
    $("heroTruck").textContent = `${t.year||""} ${t.make||""} ${t.model||""}`.trim().toUpperCase() || "NO ACTIVE TRUCK";
    ["vinGlobal","yearGlobal","makeGlobal","modelGlobal","esnGlobal","cplGlobal","odometerGlobal"].forEach(id => { if($(id)){ const key=id.replace("Global",""); $(id).value=t[key]||""; }});
    if($("engineGlobal")) $("engineGlobal").value = t.engine || "Cummins X15";
  }
};

const JobClockManager = {
  jobs:{}, interval:null,
  init(){
    this.loadJobs();
    Object.keys(this.jobs).forEach(id => { this.jobs[id].isRunning = false; this.jobs[id].lastStart = null; });
    this.saveJobs(false);
    this.renderJobs();
    this.renderAll();
    this.interval = setInterval(()=>this.renderAll(), 1000);
  },
  defaultJobs(){
    return {
      job1:{name:"Job 1", customer:"", elapsed:0, lastStart:null, isRunning:false, stopped:false, sent:{}},
      job2:{name:"Job 2", customer:"", elapsed:0, lastStart:null, isRunning:false, stopped:false, sent:{}},
      job3:{name:"Job 3", customer:"", elapsed:0, lastStart:null, isRunning:false, stopped:false, sent:{}}
    };
  },
  loadJobs(){ this.jobs = RWD.safeJson("RWD_JOBS", this.defaultJobs()); },
  saveJobs(render=true){ RWD.save("RWD_JOBS", this.jobs); if(render) this.renderAll(); },
  rate(){ return Number(RWD.settings().laborRate || 135); },
  getJobElapsed(id){
    const j=this.jobs[id]; if(!j) return 0;
    return j.isRunning && j.lastStart ? j.elapsed + (Date.now() - j.lastStart) : j.elapsed;
  },
  getJobSummary(id){
    const j=this.jobs[id]; const elapsed=this.getJobElapsed(id); const hours=elapsed/3600000; const rate=this.rate();
    return {id, name:j?.name || id, customer:j?.customer || "", elapsed, formattedTime:this.formatTime(elapsed), decimalHours:hours.toFixed(2), rate, dollars:(hours*rate).toFixed(2), status:j?.isRunning ? "RUNNING" : (j?.stopped ? "STOPPED" : "PAUSED")};
  },
  startJob(id){ const j=this.jobs[id]; if(!j || j.isRunning) return; j.isRunning=true; j.stopped=false; j.lastStart=Date.now(); this.saveJobs(); },
  pauseJob(id){ const j=this.jobs[id]; if(!j || !j.isRunning) return; j.elapsed=this.getJobElapsed(id); j.isRunning=false; j.lastStart=null; this.saveJobs(); },
  stopJob(id){ const j=this.jobs[id]; if(!j) return; this.pauseJob(id); this.jobs[id].stopped=true; this.saveJobs(); },
  clearJob(id){ if(!this.jobs[id]) return; this.jobs[id]={name:`Job ${id.slice(-1)}`,customer:"",elapsed:0,lastStart:null,isRunning:false,stopped:false,sent:{}}; this.saveJobs(); this.renderJobs(); },
  updateName(id, value){ if(this.jobs[id]){ this.jobs[id].name=value || `Job ${id.slice(-1)}`; this.saveJobs(false); }},
  updateCustomer(id, value){ if(this.jobs[id]){ this.jobs[id].customer=value || ""; this.saveJobs(false); }},
  renderJobs(){
    const grid=$("jobClockGrid"); if(!grid) return;
    grid.innerHTML = Object.keys(this.jobs).map(id => {
      const n=id.slice(-1);
      return `<article class="job-card" data-job="${id}">
        <div class="job-info"><span class="job-name">JOB ${n}</span><span class="job-stats" id="${id}-status">READY</span></div>
        <label>Job Name<input data-job-name="${id}" value="${escapeHtml(this.jobs[id].name || `Job ${n}`)}"></label>
        <label>Customer<input data-job-customer="${id}" value="${escapeHtml(this.jobs[id].customer || "")}" placeholder="Customer / unit"></label>
        <div class="job-time" id="${id}-time">00:00:00</div>
        <div class="job-money" id="${id}-money">$0.00</div>
        <div class="job-controls">
          <button data-clock="start" data-job-id="${id}">START</button>
          <button data-clock="pause" data-job-id="${id}">PAUSE</button>
          <button data-clock="stop" data-job-id="${id}">STOP</button>
          <button data-clock="clear" data-job-id="${id}">CLEAR</button>
        </div>
        <div class="job-actions">
          <button data-dispatch="invoice" data-job-id="${id}">INVOICE</button>
          <button data-dispatch="text" data-job-id="${id}">TEXT</button>
          <button data-dispatch="team" data-job-id="${id}">TEAM</button>
          <button data-dispatch="finance" data-job-id="${id}">FINANCE</button>
        </div>
      </article>`;
    }).join("");
    grid.querySelectorAll("[data-clock]").forEach(btn => btn.addEventListener("click", () => {
      const id=btn.dataset.jobId, action=btn.dataset.clock;
      if(action==="start") this.startJob(id);
      if(action==="pause") this.pauseJob(id);
      if(action==="stop") this.stopJob(id);
      if(action==="clear") this.clearJob(id);
    }));
    grid.querySelectorAll("[data-dispatch]").forEach(btn => btn.addEventListener("click", () => JobDispatcher[btn.dataset.dispatch](btn.dataset.jobId)));
    grid.querySelectorAll("[data-job-name]").forEach(inp => inp.addEventListener("input", () => this.updateName(inp.dataset.jobName, inp.value)));
    grid.querySelectorAll("[data-job-customer]").forEach(inp => inp.addEventListener("input", () => this.updateCustomer(inp.dataset.jobCustomer, inp.value)));
  },
  renderAll(){
    let total=0, running=false;
    Object.keys(this.jobs).forEach(id => {
      const s=this.getJobSummary(id); total += s.elapsed; if(this.jobs[id].isRunning) running=true;
      if($(`${id}-time`)) $(`${id}-time`).textContent=s.formattedTime;
      if($(`${id}-money`)) $(`${id}-money`).textContent=fmtMoney(s.dollars);
      if($(`${id}-status`)) $(`${id}-status`).textContent=s.status;
      if($(`${id}Mini`)) $(`${id}Mini`).textContent=s.formattedTime;
    });
    const hrs=total/3600000, money=hrs*this.rate();
    ["home-total-time","clockPageTotalTime"].forEach(id=>{ if($(id)) $(id).textContent=this.formatTime(total); });
    ["home-total-dollars","clockPageTotalMoney","weekEarnings"].forEach(id=>{ if($(id)) $(id).textContent=fmtMoney(money); });
    if($("clockRateDisplay")) $("clockRateDisplay").textContent = `$${this.rate()}/hr`;
    if($("clockStatus")) $("clockStatus").textContent = running ? "RUNNING" : "READY";
  },
  formatTime(ms){ const sec=Math.floor(ms/1000); const h=String(Math.floor(sec/3600)).padStart(2,"0"); const m=String(Math.floor((sec%3600)/60)).padStart(2,"0"); const s=String(sec%60).padStart(2,"0"); return `${h}:${m}:${s}`; }
};

const PartsManager = {
  addPart(){
    const jobId=$("partJob").value;
    const p={partNum:$("partNum").value.trim(), desc:$("partDesc").value.trim(), qty:Number($("partQty").value||1), cost:Number($("partCost").value||0), markupPercent:Number($("partMarkup").value||0)};
    p.lineTotal = ((p.cost*(1+p.markupPercent/100))*p.qty).toFixed(2);
    const parts=RWD.safeJson(`PARTS_${jobId}`, []); parts.push(p); RWD.save(`PARTS_${jobId}`, parts);
    $("partsOut").textContent=`Added ${p.partNum || "part"} to ${jobId}\nLine total: ${fmtMoney(p.lineTotal)}\n\n${JSON.stringify(parts,null,2)}`;
    showToast("Part added to job");
  },
  getParts(jobId){ return RWD.safeJson(`PARTS_${jobId}`, []); },
  getPartsTotal(jobId){ return this.getParts(jobId).reduce((sum,p)=>sum+Number(p.lineTotal||0),0); }
};

const InvoiceBuilder = {
  active:null,
  createFromJob(jobId){
    const s=JobClockManager.getJobSummary(jobId);
    const parts=PartsManager.getParts(jobId);
    const settings=RWD.settings();
    const truck=TruckManager.get();
    const labor=Number(s.dollars), partsTotal=PartsManager.getPartsTotal(jobId), shopSupplies=ShopDefaults.suppliesAmount(labor, partsTotal), subtotal=labor+partsTotal+shopSupplies, tax=subtotal*(Number(settings.tax||0)/100), total=subtotal+tax;
    this.active={jobId, settings, truck, summary:s, parts, shopSupplies, subtotal, tax, total, status:"DRAFT", created:new Date().toLocaleString()};
    RWD.save("RWD_ACTIVE_INVOICE", this.active);
    this.render();
    NavigationManager.navigate("invoice");
  },
  render(){
    const inv=this.active || RWD.safeJson("RWD_ACTIVE_INVOICE", null);
    if(!inv) return;
    this.active=inv;
    const set=inv.settings, truck=inv.truck, s=inv.summary;
    $("paperCompany").textContent=set.companyName || "Your Company";
    $("paperCompanyMeta").textContent=`${set.companyPhone||""} • ${set.companyWebsite||""}`;
    $("paperCustomer").textContent=s.customer || "Customer not set";
    $("paperVehicle").innerHTML=`${truck.year||""} ${truck.make||""} ${truck.model||""}<br>VIN: ${truck.vin||"NONE"}<br>Engine: ${truck.engine||""}`;
    const lines=[`<tr><td>Labor - ${escapeHtml(s.name)}</td><td>${s.decimalHours}</td><td>${fmtMoney(s.rate)}/hr</td><td>${fmtMoney(s.dollars)}</td></tr>`]; if(Number(inv.shopSupplies||0)>0){ lines.push(`<tr><td>Shop Supplies / Consumables</td><td>1</td><td>${fmtMoney(inv.shopSupplies)}</td><td>${fmtMoney(inv.shopSupplies)}</td></tr>`); }
    inv.parts.forEach(p=>lines.push(`<tr><td>${escapeHtml(p.partNum)} ${escapeHtml(p.desc||"")}</td><td>${p.qty}</td><td>${fmtMoney(p.cost)}</td><td>${fmtMoney(p.lineTotal)}</td></tr>`));
    $("invoiceLines").innerHTML=lines.join("");
    $("invoiceTotals").innerHTML=`<div><span>Subtotal</span><b>${fmtMoney(inv.subtotal)}</b></div><div><span>Tax</span><b>${fmtMoney(inv.tax)}</b></div><div><span>Total</span><strong>${fmtMoney(inv.total)}</strong></div>`;
    $("invoiceStatus").textContent=inv.status || "DRAFT";
  },
  billText(){
    const inv=this.active || RWD.safeJson("RWD_ACTIVE_INVOICE", null);
    if(!inv) return "No invoice created.";
    return `${inv.settings.companyName}\nInvoice ${inv.jobId}\nCustomer: ${inv.summary.customer || "Customer"}\nTruck: ${inv.truck.year||""} ${inv.truck.make||""} ${inv.truck.model||""}\nVIN: ${inv.truck.vin||"NONE"}\nLabor: ${inv.summary.decimalHours} hrs @ ${fmtMoney(inv.summary.rate)}/hr = ${fmtMoney(inv.summary.dollars)}\nParts: ${fmtMoney(PartsManager.getPartsTotal(inv.jobId))}\nTax: ${fmtMoney(inv.tax)}\nTOTAL: ${fmtMoney(inv.total)}\nPay: ${inv.settings.squareLink || "[Square link needed]"}`;
  }
};

const JobDispatcher = {
  invoice(id){ InvoiceBuilder.createFromJob(id); JobClockManager.jobs[id].sent.invoice=true; JobClockManager.saveJobs(false); showToast(`${id} sent to invoice`); },
  text(id){ const msg=`RWD Job Update: ${JobClockManager.getJobSummary(id).name} time ${JobClockManager.getJobSummary(id).formattedTime}, labor ${fmtMoney(JobClockManager.getJobSummary(id).dollars)}`; copyText(msg); showToast("Job text copied"); },
  team(id){ this.text(id); showToast("Team update copied"); },
  finance(id){ const record={...JobClockManager.getJobSummary(id), date:new Date().toISOString(), type:"labor"}; const hist=RWD.safeJson("RWD_FINANCE", []); hist.push(record); RWD.save("RWD_FINANCE", hist); FinanceManager.render(); showToast("Finance record saved"); }
};

const FinanceManager = {
  render(){
    const hist=RWD.safeJson("RWD_FINANCE", []);
    if(!$("financeOut")) return;
    $("financeOut").textContent = hist.length ? JSON.stringify(hist,null,2) : "No records yet.";
  }
};

const ScanManager = {
  async startCamera(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      $("cameraFeed").srcObject=stream; $("cameraStatus").textContent="ACTIVE"; showToast("Camera active");
    }catch(e){ $("scanOut").textContent=`Camera unavailable: ${e.message}`; showToast("Camera blocked/unavailable"); }
  },
  capture(){ $("scanOut").textContent="Frame captured placeholder. OCR/AI backend will read VIN, part numbers, labels, handwriting, and fault screens here."; }
};

const RwdAI = {
  process(input){
    const cmd=(input||"").toLowerCase().trim();
    if(!cmd) return;
    const id=this.extractJob(cmd);
    const jobCommand=/start|pause|stop|clear|invoice|finance|team|text/.test(cmd);
    if(jobCommand && !id) return this.output("Tell me Job 1, Job 2, or Job 3.");
    if(cmd.includes("start")) JobClockManager.startJob(id);
    else if(cmd.includes("pause")) JobClockManager.pauseJob(id);
    else if(cmd.includes("stop")) JobClockManager.stopJob(id);
    else if(cmd.includes("clear")) JobClockManager.clearJob(id);
    else if(cmd.includes("invoice")) JobDispatcher.invoice(id);
    else if(cmd.includes("finance")) JobDispatcher.finance(id);
    else if(cmd.includes("team")) JobDispatcher.team(id);
    else if(cmd.includes("text")) JobDispatcher.text(id);
    else if(cmd.includes("fleetpride") || cmd.includes("dealer") || cmd.includes("parts near")) { window.open("https://www.google.com/maps/search/heavy+duty+truck+parts+near+me", "_blank"); this.output("Opening nearby heavy-duty parts dealers."); }
    else if(cmd.includes("parts") || cmd.includes("part")) { NavigationManager.navigate("parts"); this.output("Opened Parts / Scan. Live web pricing needs backend/vendor lookup."); }
    else if(cmd.includes("truck") || cmd.includes("vin")) { NavigationManager.navigate("truck"); this.output("Opened Truck Profile."); }
    else this.output("RWD AI command shell ready. Backend AI/web search plugs in next.");
  },
  extractJob(cmd){ const m=cmd.match(/job\s*([1-3])/); return m ? `job${m[1]}` : null; },
  output(text){
    const box=$("chatBox");
    if(box){ box.innerHTML += `<div class="ai-msg">${escapeHtml(text)}</div>`; box.scrollTop=box.scrollHeight; }
    showToast(text);
  }
};

const ButtonAudit = {
  run(){
    const buttons=qsa("[data-nav]"); const screens=qsa(".screen").map(s=>s.id); const missing=[];
    buttons.forEach(b=>{ if(!screens.includes(b.dataset.nav)) missing.push(`${b.textContent.trim()} -> ${b.dataset.nav}`); });
    const report={buttons:buttons.length, screens:screens.length, missingTargets:missing.length, missing};
    $("auditStatus").textContent=missing.length ? "FAIL" : "PASS";
    $("alertCount").textContent=missing.length;
    return report;
  }
};

const DebugPanel = {
  refresh(){
    const report=ButtonAudit.run();
    const state={audit:report,jobs:JobClockManager.jobs,truck:TruckManager.get(),invoice:RWD.safeJson("RWD_ACTIVE_INVOICE",null),finance:RWD.safeJson("RWD_FINANCE",[]),settings:RWD.settings(),theme:document.body.dataset.theme,version:"new-repo-build-1.0"};
    $("debugOutput").textContent=JSON.stringify(state,null,2);
  }
};

const Actions = {
  run(action, el){
    if(action==="menu") MenuManager.toggle();
    if(action==="close-menu") MenuManager.close();
    if(action==="nav-back") NavigationManager.back();
    if(action==="nav-home") NavigationManager.navigate("home");
    if(action==="clear-screen") ScreenControls.clearCurrent();
    if(action==="save-truck") TruckManager.saveFromForm();
    if(action==="clear-truck") TruckManager.clear();
    if(action==="add-part") PartsManager.addPart();
    if(action==="start-camera") ScanManager.startCamera();
    if(action==="capture-scan") ScanManager.capture();
    if(action==="save-settings") this.saveSettings();
    if(action==="ask-ai") this.askAI();
    if(action==="build-smart-quote") SmartQuoteEngine.build();
    if(action==="quote-copy-customer") SmartQuoteEngine.copyCustomer();
    if(action==="quote-to-workorder") SmartQuoteEngine.toWorkOrder();
    if(action==="quote-to-invoice") SmartQuoteEngine.toInvoice();
    if(action==="voice") showToast("Voice shell ready. Browser speech backend plugs in next.");
    if(action==="ai-full-back") NavigationManager.back();
    if(action==="ai-full-clear") AiFullScreen.clear();
    if(action==="ai-full-send") AiFullScreen.send();
    if(action==="ai-full-voice") showToast("Voice shell ready. Speech backend plugs in next.");
    if(action==="open-ai-drawer") AiFullScreen.open();
    if(action==="parts-ai-search") PartsBrain.run();
    if(action==="parts-mode-unknown") PartsBrain.setMode("unknown");
    if(action==="parts-mode-number") PartsBrain.setMode("number");
    if(action==="parts-mode-cross") PartsBrain.setMode("cross");
    if(action==="parts-mode-fitment") PartsBrain.setMode("fitment");
    if(action==="parts-upload-photo"){ AiFullScreen.open(); $("aiFullUpload")?.click(); }
    if(action==="parts-take-photo"){ AiFullScreen.open(); $("aiFullCamera")?.click(); }
    if(action==="close-ai-drawer") AiDrawer.close();
    if(action==="clear-ai-chat") AiDrawer.clear();
    if(action==="ask-ai-drawer") AiDrawer.ask();
    if(action==="save-shop-defaults") ShopDefaults.save();
    if(action==="copy-invoice") copyText(InvoiceBuilder.billText());
    if(action==="send-square") this.sendSquare();
    if(action==="run-audit") DebugPanel.refresh();
    if(action==="clear-local"){ if(confirm("Clear local app data?")){ localStorage.clear(); location.reload(); } }
  },
  saveSettings(){
    const settings={companyName:$("companyName").value,companyPhone:$("companyPhone").value,companyWebsite:$("companyWebsite").value,laborRate:Number($("defaultLaborRate").value||135),tax:Number($("defaultTax").value||0),squareLink:$("squareLink").value};
    RWD.save("RWD_SETTINGS", settings);
    showToast("Settings saved");
    JobClockManager.renderAll();
    InvoiceBuilder.render();
  },
  askAI(){
    const input=$("aiInput"); const text=input.value.trim(); if(!text) return;
    $("chatBox").innerHTML += `<div class="user-msg">${escapeHtml(text)}</div>`;
    input.value="";
    RwdAI.process(text);
  },
  sendSquare(){
    const inv=RWD.safeJson("RWD_ACTIVE_INVOICE", null);
    const settings=RWD.settings();
    if(!inv) return showToast("No invoice ready");
    copyText(InvoiceBuilder.billText());
    inv.status="SENT"; RWD.save("RWD_ACTIVE_INVOICE", inv); InvoiceBuilder.active=inv; InvoiceBuilder.render();
    window.open(settings.squareLink || "https://squareup.com/dashboard", "_blank");
  }
};


/* ===== V4 HARDENED DELIVERY SYSTEMS ===== */
const OemEnvironmentManager={init(){const saved=localStorage.getItem("RWD_OEM_ENV")||"cummins";this.apply(saved,false);qsa("[data-oem]").forEach(btn=>btn.addEventListener("click",()=>this.apply(btn.dataset.oem,true)))},apply(oem,toastIt=true){document.body.dataset.oem=oem;localStorage.setItem("RWD_OEM_ENV",oem);if(typeof ThemeManager!=="undefined")ThemeManager.setGhost();if(toastIt)showToast("OEM environment: "+oem.toUpperCase())}};
const ShopDefaults={get(){return RWD.safeJson("RWD_SHOP_DEFAULTS",{defaultJobType:"In-House",serviceCallFee:250,shopSuppliesMode:"percentLabor",shopSuppliesValue:5,emergencyMultiplier:1.5,travelFee:0})},loadForm(){const d=this.get();["defaultJobType","serviceCallFee","shopSuppliesMode","shopSuppliesValue","emergencyMultiplier","travelFee"].forEach(id=>{if($(id))$(id).value=d[id]})},save(){const d={defaultJobType:$("defaultJobType")?.value||"In-House",serviceCallFee:Number($("serviceCallFee")?.value||250),shopSuppliesMode:$("shopSuppliesMode")?.value||"percentLabor",shopSuppliesValue:Number($("shopSuppliesValue")?.value||5),emergencyMultiplier:Number($("emergencyMultiplier")?.value||1.5),travelFee:Number($("travelFee")?.value||0)};RWD.save("RWD_SHOP_DEFAULTS",d);showToast("Shop defaults saved")},suppliesAmount(labor,parts){const d=this.get();if(d.shopSuppliesMode==="off")return 0;if(d.shopSuppliesMode==="fixed")return d.shopSuppliesValue;if(d.shopSuppliesMode==="percentTotal")return(labor+parts)*(d.shopSuppliesValue/100);return labor*(d.shopSuppliesValue/100)}};
const JobKitsManager={buildKit(q){q=(q||"").toLowerCase();if(q.includes("water pump"))return{title:"WATER PUMP JOB KIT",items:["Water pump assembly options","Water pump gasket / seal","ELC coolant top-off or refill","Hose clamps if disturbed","Thermostat seals if housing removed","Belt inspection / replacement option","Coolant filter if equipped","Drain pan / recovery container","Pressure test after repair"],note:"Show likely options first, then ask last 8 VIN for exact verified part number."};if(q.includes("nox"))return{title:"NOX SENSOR JOB KIT",items:["NOx sensor","Anti-seize as required","Harness clips / pigtail inspection","Sensor socket","Regen / fault clear workflow","Connector corrosion check"],note:"Verify upstream/downstream position and connector style."};return{title:"CUSTOM JOB KIT",items:["Primary part","Seals / gaskets / O-rings","One-time-use hardware","Fluids / consumables","Special tools","Related sensors / connectors","Labor estimate","Torque / install notes"],note:"Use last 8 VIN for exact verified fitment."}},render(q){const k=this.buildKit(q);return `<div class="job-kit-card"><h4>${escapeHtml(k.title)}</h4><ul>${k.items.map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul><p>${escapeHtml(k.note)}</p></div>`}};
const AiDrawer={attached:null,open(){$("aiDrawer")?.classList.add("open");$("aiDrawer")?.setAttribute("aria-hidden","false");setTimeout(()=>$("aiDrawerInput")?.focus(),50)},close(){$("aiDrawer")?.classList.remove("open");$("aiDrawer")?.setAttribute("aria-hidden","true")},clear(){if($("aiDrawerChat"))$("aiDrawerChat").innerHTML=`<div class="ai-msg">Chat cleared. Ask RWD AI anything.</div>`;this.attached=null;if($("aiAttachPreview"))$("aiAttachPreview").textContent="No photo attached."},addMessage(role,text){const box=$("aiDrawerChat")||$("chatBox");if(!box)return;box.innerHTML+=`<div class="${role==="user"?"user-msg":"ai-msg"}">${text}</div>`;box.scrollTop=box.scrollHeight},handleFile(file){if(!file)return;this.attached=file;const url=URL.createObjectURL(file);$("aiAttachPreview").innerHTML=`Attached: ${escapeHtml(file.name||"photo")}<img src="${url}" alt="attached photo">`;this.addMessage("ai","Photo attached. Ask what you want to know about it.")},ask(){const input=$("aiDrawerInput");const text=input?.value?.trim()||"";if(!text&&!this.attached)return;if(text)this.addMessage("user",escapeHtml(text));if(input)input.value="";this.addMessage("ai",this.localAnswer(text))},localAnswer(text){const q=(text||"").toLowerCase();
    if(q.includes("what time") || q==="time") return "Current device time: "+new Date().toLocaleTimeString();
    if(q.includes("where am i") || q.includes("where am")){ setTimeout(()=>GpsModule.whereAmI(),0); return "Opening location check. Allow location permission if prompted."; }if(q.includes("water pump")||q.includes("job kit"))return `Here is the job-kit workflow before ordering:${JobKitsManager.render(q)}<button class="pro-btn-gold" onclick="NavigationManager.navigate('parts')">OPEN PARTS</button>`;if(q.includes("fleetpride")||q.includes("parts near"))return `<button class="pro-btn-gold" onclick="window.open('https://www.google.com/maps/search/FleetPride+near+me','_blank')">OPEN FLEETPRIDE</button>`;if(q.includes("start job 1")){JobClockManager.startJob("job1");return"Started Job 1."}if(q.includes("start job 2")){JobClockManager.startJob("job2");return"Started Job 2."}if(q.includes("start job 3")){JobClockManager.startJob("job3");return"Started Job 3."}if(this.attached)return"Photo is attached. Full OCR/image AI needs backend, but the workflow is ready.";return"RWD AI shell ready. Backend web/AI search will answer like ChatGPT/Google/Gemini with VIN, parts, photos, sources, and estimated costs."}};


/* ===== V4.1 AI / PARTS / GPS HARDENING ===== */


const PartsBrain = {
  mode:"lookup",
  setMode(mode){
    this.mode=mode;
    const out=$("partsAiOutput");
    if(out) out.innerHTML=`<b>${mode.toUpperCase()} MODE</b><br>Ask for part number, what it fits, cross reference, or verify with last 8 VIN.`;
  },
  answer(q){
    q=(q||"").trim(); const low=q.toLowerCase();
    if(!q) return "Ask for a part, upload photo, scan number, or describe truck/engine/job.";
    if(low.includes("water pump") && (low.includes("x15") || low.includes("cummins"))) return `<b>2019 Cummins X15 Water Pump</b><br>Likely X15 highway-platform pump family. Show likely options first. Ask last 8 VIN before final ordering.<br><br>${JobKitsManager.render("water pump")}`;
    if((low.includes("dd13") || low.includes("dd 13")) && low.includes("water pump")) return `<b>2017 Detroit DD13 Water Pump</b><br>Likely DD13/DD15 pump family. Mechanical vs variable-speed must be verified. Ask last 8 VIN or ESN before ordering.<br><br>${JobKitsManager.render("water pump")}`;
    if(low.match(/\\b\\d{5,}\\b/) || low.includes("part number") || low.includes("what does") || low.includes("fit")) return `<b>Part Number Lookup / Cross Reference</b><br>Query: ${escapeHtml(q)}<br>Show what it fits, OEM/aftermarket crosses, supersessions, market estimate, job kit, and last 8 VIN prompt.`;
    return `<b>Parts Lookup Brain</b><br>Query: ${escapeHtml(q)}<br>Show likely OEM/aftermarket options first, estimated cost range, job kit, then ask last 8 VIN only when exact fitment matters.`;
  },
  run(){ const out=$("partsAiOutput"); if(out) out.innerHTML=this.answer($("partsQuestion")?.value||""); }
};




const GpsModule = {
  lastPosition:null,
  render(){
    const panel = document.querySelector("#gps .generic-card");
    if(!panel) return;
    panel.innerHTML = `<div class="pro-panel roadside-panel">
      <div class="pro-header"><h3>PIN DROP / ROADSIDE</h3><span class="status-pill">ROAD CALL READY</span></div>
      <div class="route-grid">
        <button class="route-card route-wide" onclick="GpsModule.whereAmI()"><b>📍 PIN BROKEN TRUCK</b><span>Capture disabled unit location and create a road-call map link.</span></button>
        <button class="route-card" onclick="GpsModule.copyLocation()"><b>COPY LOCATION</b><span>Copy last pinned truck map link.</span></button>
        <button class="route-card" onclick="NavigationManager.navigate('emergency')"><b>ROADSIDE FLOW</b><span>Open emergency workflow.</span></button>
        <button class="route-card" onclick="NavigationManager.navigate('clock')"><b>START CLOCK</b><span>Track travel/labor time.</span></button>
      </div>
      <div class="view-area" id="gpsOutput">Tap PIN BROKEN TRUCK when you are at or near the disabled unit.</div>
    </div>`;
  },
  whereAmI(){
    const out=$("gpsOutput");
    if(!navigator.geolocation){ if(out) out.textContent="Geolocation not supported."; return; }
    if(out) out.textContent="Getting broken-truck location...";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude}=pos.coords;
      this.lastPosition={latitude,longitude,ts:new Date().toISOString()};
      localStorage.setItem("RWD_LAST_PIN_DROP", JSON.stringify(this.lastPosition));
      const link=`https://maps.google.com/?q=${latitude},${longitude}`;
      if(out) out.innerHTML=`<b>Broken truck pinned.</b><br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}<br><br><button class="pro-btn-gold" onclick="window.open('${link}','_blank')">OPEN MAP</button>`;
      showToast("Broken truck location pinned");
    },err=>{ if(out) out.textContent="Location blocked/unavailable: "+err.message; });
  },
  copyLocation(){
    const saved = this.lastPosition || RWD.safeJson("RWD_LAST_PIN_DROP", null);
    if(!saved){ showToast("No pin saved yet"); return; }
    const link=`https://maps.google.com/?q=${saved.latitude},${saved.longitude}`;
    navigator.clipboard?.writeText(`Broken truck location: ${link}`);
    showToast("Location copied");
  }
};



const AiFullScreen = {
  attached:null,
  open(){
    NavigationManager.navigate("ai-full");
    setTimeout(()=>$("aiFullInput")?.focus(),60);
  },
  add(role, html){
    const box=$("aiFullChat"); if(!box) return;
    box.innerHTML += `<div class="${role==="user"?"user-msg":"ai-msg"}">${html}</div>`;
    box.scrollTop = box.scrollHeight;
  },
  clear(){
    if($("aiFullChat")) $("aiFullChat").innerHTML = `<div class="ai-msg">Chat cleared. Ask Rolling Wrench AI anything.</div>`;
    this.attached=null;
    if($("aiFullAttach")) $("aiFullAttach").textContent="No photo attached.";
  },
  handleFile(file){
    if(!file) return;
    this.attached=file;
    const url=URL.createObjectURL(file);
    $("aiFullAttach").innerHTML=`Attached: ${escapeHtml(file.name || "photo")}<img src="${url}" alt="attached photo">`;
    this.add("ai","Photo attached. Ask what you want to know about it.");
  },
  send(){
    const input=$("aiFullInput"); const text=input?.value?.trim() || "";
    if(!text && !this.attached) return;
    if(text) this.add("user", escapeHtml(text));
    if(input) input.value="";
    this.add("ai", this.answer(text));
  },
  answer(text){
    const q=(text||"").toLowerCase();
    if(q.includes("what time") || q==="time") return "Current device time: "+new Date().toLocaleTimeString();
    if(q.includes("where am i") || q.includes("where am")){
      setTimeout(()=>{ NavigationManager.navigate("gps"); setTimeout(()=>GpsModule.whereAmI(),150); },50);
      return "Opening Pin Drop / location check. Allow location permission if prompted.";
    }
    if(q.includes("water pump") || q.includes("job kit")) return `Here is the field job-kit workflow:${JobKitsManager.render(q)}<button class="pro-btn-gold" onclick="NavigationManager.navigate('parts')">OPEN PARTS</button>`;
    if(q.includes("part") || q.includes("sensor") || q.includes("filter")) return `Parts lookup mode: show likely OEM/aftermarket options first, estimated cost, job kit, then ask last 8 VIN for exact fitment.<br><button class="pro-btn-gold" onclick="NavigationManager.navigate('parts')">OPEN OEM PARTS</button>`;
    if(this.attached) return "Photo workflow is ready. Backend OCR/image AI plugs in next for identifying parts, damage, leaks, labels, and repair steps.";
    return "RWD AI front-end is ready. Backend AI/web/supplier/OCR connection is needed for full ChatGPT/Gemini-style answers.";
  }
};


const SmartQuoteEngine = {
  type:"inhouse", active:null,
  init(){
    qsa("[data-quote-type]").forEach(btn => btn.addEventListener("click", () => {
      this.type = btn.dataset.quoteType;
      qsa("[data-quote-type]").forEach(b => b.classList.toggle("active", b === btn));
      if($("quoteRequest")?.value.trim()) this.build();
    }));
  },
  inferJob(q){
    const s=(q||"").toLowerCase();
    if((s.includes("x15") || s.includes("cummins")) && s.includes("water pump")){
      return {title:"2019 Cummins X15 Water Pump", laborHours:6.6, partLow:380, partHigh:650, customerPart:625,
        kit:["Water pump","Pump gasket/seal","ELC coolant","Hose clamps if disturbed","Belt inspection","Pressure test"],
        notes:"Show likely options first. Ask last 8 VIN to verify exact pump before ordering."};
    }
    if((s.includes("dd13") || s.includes("dd 13")) && s.includes("water pump")){
      return {title:"Detroit DD13 Water Pump", laborHours:6.1, partLow:320, partHigh:850, customerPart:725,
        kit:["DD13 water pump","Gasket/seal","Coolant","Clamps if disturbed","Belt inspection","Pressure test"],
        notes:"Mechanical vs variable-speed pump must be verified by last 8 VIN/ESN."};
    }
    return {title:q ? q.toUpperCase() : "Custom Service Quote", laborHours:2.3, partLow:0, partHigh:0, customerPart:0,
      kit:["Primary part","Seals/gaskets","Shop supplies","Related hardware","Test after repair"],
      notes:"Custom estimate. Verify part, labor, and fitment before sending final quote."};
  },
  money(n){ return "$" + Number(n||0).toFixed(2); },
  build(){
    const job=this.inferJob($("quoteRequest")?.value || "");
    const rate=Number($("quoteLaborRate")?.value || 135);
    const serviceBase=Number($("quoteServiceFee")?.value || 250);
    const taxRate=Number($("quoteTaxRate")?.value || 0);
    const suppliesRate=Number($("quoteSuppliesRate")?.value || 0);
    let labor=job.laborHours*rate, service=0, type=this.type;
    if(type==="mobile") service=serviceBase;
    if(type==="roadside"){ service=serviceBase; labor*=1.25; }
    const supplies=labor*(suppliesRate/100);
    const subtotal=labor+job.customerPart+service+supplies;
    const tax=subtotal*(taxRate/100);
    const total=subtotal+tax;
    this.active={type,job,rate,labor,service,supplies,tax,total};
    $("quoteInternal").innerHTML=`<b>${job.title}</b><br>Type: ${type.toUpperCase()}<br>Labor: ${job.laborHours.toFixed(1)} hr @ ${this.money(rate)}/hr<br>Internal market part range: ${this.money(job.partLow)} - ${this.money(job.partHigh)}<br>Customer part line: ${this.money(job.customerPart)}<br>Service fee: ${this.money(service)}<br>Shop supplies: ${this.money(supplies)}<br><br><b>Job Kit:</b><br>${job.kit.map(x=>"• "+x).join("<br>")}<br><br>${job.notes}`;
    $("quoteCustomer").innerHTML=`<b>${job.title}</b><br>Labor: ${this.money(labor)}<br>Parts / Materials: ${this.money(job.customerPart)}<br>${service>0 ? "Service Call: "+this.money(service)+"<br>" : ""}Shop Supplies: ${this.money(supplies)}<br>Tax: ${this.money(tax)}<hr><b>Total Estimate: ${this.money(total)}</b><br><small>Estimate pending exact fitment/parts availability.</small>`;
    this.renderPaper();
    return this.active;
  },
  renderPaper(){
    const a=this.active; if(!a || !$("invoice-paper-layout")) return; const j=a.job;
    $("invoice-paper-layout").innerHTML=`<table class="invoice-table"><thead><tr><th>Description</th><th>Qty/Hrs</th><th>Total</th></tr></thead><tbody><tr><td>${escapeHtml(j.title)} Labor</td><td>${j.laborHours.toFixed(1)}</td><td>${this.money(a.labor)}</td></tr><tr><td>Parts / Materials</td><td>1</td><td>${this.money(j.customerPart)}</td></tr>${a.service>0?`<tr><td>Service Call</td><td>1</td><td>${this.money(a.service)}</td></tr>`:""}<tr><td>Shop Supplies</td><td>1</td><td>${this.money(a.supplies)}</td></tr><tr><td>Tax</td><td></td><td>${this.money(a.tax)}</td></tr></tbody></table><div class="invoice-totals"><div><span>Total Estimate</span><strong>${this.money(a.total)}</strong></div></div><p><b>Job Kit:</b> ${j.kit.join(", ")}</p><p><b>Note:</b> ${escapeHtml(j.notes)}</p>`;
  },
  copyCustomer(){
    if(!this.active) this.build(); const a=this.active, j=a.job;
    const txt=`Rolling Wrench Estimate\n${j.title}\nLabor: ${this.money(a.labor)}\nParts/Materials: ${this.money(j.customerPart)}\n${a.service>0?"Service Call: "+this.money(a.service)+"\n":""}Shop Supplies: ${this.money(a.supplies)}\nTax: ${this.money(a.tax)}\nTotal Estimate: ${this.money(a.total)}\nPending exact fitment/parts availability.`;
    navigator.clipboard?.writeText(txt); showToast("Customer quote copied");
  },
  toWorkOrder(){
    const a=this.active || this.build(); NavigationManager.navigate("workorders");
    setTimeout(()=>{ if($("woComplaint")) $("woComplaint").value="Customer requested quote: "+a.job.title; if($("woNotes")) $("woNotes").value="Quoted job kit: "+a.job.kit.join(", ")+". "+a.job.notes; },150);
  },
  toInvoice(){ this.build(); showToast("Paper estimate updated"); }
};


const RouteGuard = {
  install(){
    qsa("[data-nav]").forEach(btn=>{
      const t=(btn.textContent||"").trim();
      if(t.includes("AI Assistant") || t.includes("AI Brain")) btn.dataset.nav="ai-full";
      if(t.includes("Repair Orders") || t.includes("Work Orders")) btn.dataset.nav="workorders";
      if(t.includes("Emergency Roadside")) btn.dataset.nav="emergency";
      if(t.includes("OEM Parts")) btn.dataset.nav="parts";
    });
  }
};
const ThemeResetManager = {
  init(){
    const saved=localStorage.getItem("RWD_THEME_CHOICE")||"default";
    this.apply(saved,false);
    qsa("[data-theme-choice]").forEach(b=>b.addEventListener("click",()=>this.apply(b.dataset.themeChoice,true)));
  },
  apply(choice,toastIt=true){
    document.body.dataset.themeChoice=choice;
    if(choice==="default"){
      delete document.body.dataset.oem;
      localStorage.removeItem("RWD_OEM_ENV");
      localStorage.setItem("RWD_THEME_CHOICE","default");
    }else{
      localStorage.setItem("RWD_THEME_CHOICE",choice);
      if(["cummins","detroit","cat","paccar"].includes(choice)){
        document.body.dataset.oem=choice;
        localStorage.setItem("RWD_OEM_ENV",choice);
      }else{
        delete document.body.dataset.oem;
      }
    }
    if(toastIt) showToast("Theme: "+choice.toUpperCase());
  }
};


/* ===== NAVIGATION FIX: HOME / MENU / BACK / CLEAR ===== */
const MenuManager = {
  toggle(){
    const menu = $("sideMenu");
    if(!menu) return;
    menu.classList.toggle("open");
    menu.setAttribute("aria-hidden", menu.classList.contains("open") ? "false" : "true");
  },
  close(){
    const menu = $("sideMenu");
    if(!menu) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  }
};

const ScreenControls = {
  installed:false,
  install(){
    if(this.installed) return;
    qsa("main.screen").forEach(screen => {
      if(screen.id === "home") return;
      if(screen.querySelector(".screen-control-row")) return;
      const row = document.createElement("div");
      row.className = "screen-control-row";
      row.innerHTML = '<button data-action="nav-back">← BACK</button><button data-action="nav-home">⌂ HOME</button><button data-action="clear-screen">CLEAR</button>';
      screen.insertBefore(row, screen.firstElementChild);
    });
    document.addEventListener("click", e => {
      const menu = $("sideMenu");
      if(!menu || !menu.classList.contains("open")) return;
      if(e.target.closest("#sideMenu") || e.target.closest('[data-action="menu"]')) return;
      MenuManager.close();
    }, true);
    document.addEventListener("keydown", e => { if(e.key === "Escape") MenuManager.close(); });
    this.installed = true;
  },
  refresh(id){
    qsa(".screen-control-row").forEach(row => row.style.display = id === "home" ? "none" : "flex");
  },
  clearCurrent(){
    const screen = $(NavigationManager.current);
    if(!screen) return;
    screen.querySelectorAll("input, textarea").forEach(el => {
      if(["button","submit","file","checkbox","radio"].includes(el.type)) return;
      el.value = "";
    });
    screen.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
    showToast("Screen cleared");
  }
};

NavigationManager.back = function(){
  const prev = this.history.pop();
  this.navigate(prev || "home", {skipHistory:true});
};


/* ===== V5.2 HOME ROUTE ALIAS FIX ===== */
const HomeRouteAlias = {
  homeId:"home",
  install(){
    qsa('[data-nav="home"]').forEach(btn => btn.dataset.nav = this.homeId);
  },
  resolve(id){ return id === "home" ? this.homeId : id; }
};

function buildModules(){
  const grid=$("moduleGrid"); if(!grid) return;
  grid.innerHTML=Modules.map(([title,desc,nav,ico])=>`<button class="module-card" data-nav="${nav}"><span class="mod-icon">${ico}</span><b>${title}</b><small>${desc}</small></button>`).join("");
}

function openGeneric(title, desc){
  $("genericTitle").textContent = title;
  $("genericContent").innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p><p>This module is wired to its own view shell. Backend/live data plugs in next without changing the home layout.</p>`;
  NavigationManager.navigate("generic");
}

function copyText(text){ navigator.clipboard?.writeText(text); showToast("Copied"); }
function showToast(msg){ const t=$("toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove("show"),1200); }
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }

function boot(){
  buildModules();
  RouteGuard.install();
  ScreenControls.install();
  HomeRouteAlias.install();
  NavigationManager.init();
  ThemeManager.init();
  TruckManager.apply();
  JobClockManager.init();
  InvoiceBuilder.render();
  FinanceManager.render();
  $("masterCommandInput").addEventListener("focus", () => AiFullScreen.open());
  $("masterCommandInput").addEventListener("keydown", e => { if(e.key==="Enter"){ AiFullScreen.open(); $("aiFullInput").value=e.target.value; AiFullScreen.send(); e.target.value=""; }});
  $("aiInput").addEventListener("keydown", e => { if(e.key==="Enter") Actions.askAI(); });
  $("aiDrawerInput")?.addEventListener("keydown", e => { if(e.key==="Enter") AiDrawer.ask(); });
  $("aiUploadPhoto")?.addEventListener("change", e => AiDrawer.handleFile(e.target.files?.[0]));
  $("aiTakePhoto")?.addEventListener("change", e => AiDrawer.handleFile(e.target.files?.[0]));
  OemEnvironmentManager.init();
  ThemeResetManager.init();
  $("aiFullInput")?.addEventListener("keydown", e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); AiFullScreen.send(); }});
  $("aiFullUpload")?.addEventListener("change", e => AiFullScreen.handleFile(e.target.files?.[0]));
  $("aiFullCamera")?.addEventListener("change", e => AiFullScreen.handleFile(e.target.files?.[0]));
  ShopDefaults.loadForm();
  SmartQuoteEngine.init();
  DebugPanel.refresh();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
}
document.addEventListener("DOMContentLoaded", boot);