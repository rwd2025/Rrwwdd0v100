/* Rolling Wrench Diesel BA001 finish layer
   Purpose: keep V5 look, wire modules to one local data model, and expose backend-ready adapters. */
(function(){
  'use strict';
  const $ = (id)=>document.getElementById(id);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const money = (n)=>'$'+Number(n||0).toFixed(2);
  const nowIso = ()=>new Date().toISOString();
  const esc = (s)=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const read = (k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d));}catch{return d;}};
  const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const uid = (p)=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  const DB = {
    customers:()=>read('BA001_CUSTOMERS',[]), trucks:()=>read('BA001_TRUCKS',[]), workorders:()=>read('BA001_WORKORDERS',[]),
    quotes:()=>read('BA001_QUOTES',[]), invoices:()=>read('BA001_INVOICES',[]), scans:()=>read('BA001_SCANS',[]), parts:()=>read('BA001_PARTS',[]),
    put(name,val){ save('BA001_'+name.toUpperCase(), val); pulse(); }
  };

  const Adapters = window.BA001Adapters = {
    async vinDecode(vin){
      return {ok:false, source:'local-adapter', message:'Backend VIN API not connected yet', vin, decoded: basicVinGuess(vin)};
    },
    async ocr(fileOrText){
      const text = typeof fileOrText === 'string' ? fileOrText : '';
      return {ok:false, source:'local-adapter', message:'OCR backend not connected yet', extracted: extractParts(text)};
    },
    async partsLookup(query, truck){
      return {ok:false, source:'local-adapter', message:'Live OEM/supplier backend not connected yet', query, truck, suggestions: localPartSuggestions(query)};
    },
    async sync(payload){
      const queue=read('BA001_SYNC_QUEUE',[]); queue.push({id:uid('sync'),date:nowIso(),payload}); save('BA001_SYNC_QUEUE',queue);
      return {ok:false, queued:true, message:'No backend URL set. Saved to sync queue.'};
    }
  };

  function basicVinGuess(vin){
    vin=(vin||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(vin.length<8) return {note:'Enter full VIN or last 8 for exact lookup when backend is connected.'};
    return {last8:vin.slice(-8), year:'VERIFY', make:'VERIFY', model:'VERIFY', note:'Exact decode requires backend/NHTSA/OEM lookup.'};
  }
  function extractParts(text){
    const nums=(text.match(/[A-Z0-9-]{5,}/g)||[]).slice(0,12);
    const prices=(text.match(/\$?\d{1,5}\.\d{2}/g)||[]).slice(0,12);
    return {partNumbers:nums, prices};
  }
  function localPartSuggestions(q){
    q=(q||'').toLowerCase();
    const kit=(items)=>items.map((name,i)=>({name, qty:1, note:i?'related item':'primary item'}));
    if(q.includes('water pump')) return kit(['Water pump assembly','Gasket / O-ring kit','ELC coolant','Belt inspection','Pressure test after install']);
    if(q.includes('nox')) return kit(['NOx sensor','Sensor socket','Harness/connector inspection','Regen/fault clear']);
    if(q.includes('dpf')||q.includes('doc')) return kit(['DPF/DOC gasket clamps','Temp/pressure sensor check','Differential tubes cleaning','Forced regen test']);
    return kit(['Primary part','Seals/gaskets','Hardware','Fluids/consumables','Labor note']);
  }

  function activeTruck(){
    const t=read('RWD_TRUCK',{vin:'NONE',year:'',make:'',model:'',engine:'Cummins X15',esn:'',cpl:'',odometer:''});
    return t;
  }
  function settings(){
    return read('RWD_SETTINGS',{companyName:'Rolling Wrench Diesel',companyPhone:'260-502-6222',companyWebsite:'www.rollingwrenchdiesel.com',laborRate:135,tax:0,squareLink:''});
  }
  function jobSummary(){
    const jobs=read('RWD_JOBS',{}); let ms=0;
    Object.values(jobs).forEach(j=>{ms+=Number(j.elapsed||0);});
    const hrs=ms/3600000, rate=Number(settings().laborRate||135);
    return {hours:hrs, labor:hrs*rate};
  }

  function ensureScreen(id,title){
    let s=$(id); if(s) return s;
    const generic=$('generic')||document.querySelector('.ui-layer');
    s=document.createElement('main'); s.className='screen'; s.id=id;
    s.innerHTML=`<h2 class="screen-title">${esc(title)}</h2><section class="generic-card"></section>`;
    generic.parentNode.insertBefore(s,generic);
    return s;
  }
  function setScreen(id,title,html){
    const s=ensureScreen(id,title); const h=s.querySelector('.screen-title'); if(h)h.textContent=title;
    const c=s.querySelector('.generic-card')||s; c.innerHTML=html; return s;
  }
  function nav(id){
    if(window.NavigationManager&&typeof window.NavigationManager.navigate==='function') window.NavigationManager.navigate(id);
    else { $$('.screen').forEach(x=>x.classList.toggle('active',x.id===id)); }
  }

  function installModules(){
    // Add missing customer/schedule buttons without changing existing V5 look.
    const grid=$('moduleGrid');
    if(grid && !grid.querySelector('[data-nav="customers"]')){
      grid.insertAdjacentHTML('beforeend',`<button class="module-card" data-nav="customers"><span class="mod-icon">👤</span><b>Customers</b><small>Customer DB</small></button><button class="module-card" data-nav="schedule"><span class="mod-icon">📅</span><b>Schedule</b><small>Jobs calendar</small></button>`);
    }
    setScreen('customers','Customers',customersHtml());
    setScreen('schedule','Schedule',scheduleHtml());
    enrichInvoice(); enrichParts(); enrichScan(); enrichDebug();
  }

  function customersHtml(){return `<div class="ba001-panel"><span class="ba001-pill">FULLY WIRED LOCAL DB</span><div class="ba001-grid"><label>Name<input id="cName" placeholder="Customer name"></label><label>Phone<input id="cPhone" placeholder="Phone"></label><label>Email<input id="cEmail" placeholder="Email"></label><label>Company<input id="cCompany" placeholder="Company"></label></div><label>Notes<textarea id="cNotes" placeholder="Notes, billing terms, units..."></textarea></label><div class="ba001-actions"><button data-ba001="save-customer">SAVE CUSTOMER</button><button data-ba001="new-workorder">NEW WORK ORDER</button></div><div class="ba001-list" id="customerList"></div></div>`;}
  function scheduleHtml(){return `<div class="ba001-panel"><span class="ba001-pill">SCHEDULE + WORK ORDERS</span><div class="ba001-grid"><label>Date<input id="sDate" type="date"></label><label>Time<input id="sTime" type="time"></label><label>Customer<input id="sCustomer" placeholder="Customer"></label><label>Job Type<select id="sType"><option>In shop</option><option>Mobile service call</option><option>Roadside</option><option>Aftertreatment</option><option>PM Service</option></select></label></div><label>Job Notes<textarea id="sNotes" placeholder="What needs done?"></textarea></label><div class="ba001-actions"><button data-ba001="save-schedule">SAVE JOB</button><button data-ba001="schedule-to-wo">SEND TO WORK ORDER</button></div><div class="ba001-list" id="scheduleList"></div></div>`;}

  function enrichInvoice(){
    const inv=$('invoice'); if(!inv || inv.dataset.ba001) return; inv.dataset.ba001='1';
    inv.insertAdjacentHTML('beforeend',`<section class="ba001-panel"><span class="ba001-pill">BA001 FINAL WIRING</span><div class="ba001-grid"><label>Customer<input id="baInvCustomer" placeholder="Customer"></label><label>Job / RO #<input id="baInvRo" placeholder="RO number"></label><label>Labor Hours<input id="baInvHours" type="number" step="0.1" placeholder="0.0"></label><label>Labor Rate<input id="baInvRate" type="number" value="135"></label><label>Parts Total<input id="baInvParts" type="number" step="0.01" value="0"></label><label>Tax %<input id="baInvTax" type="number" step="0.01" value="0"></label></div><label>Complaint / Cause / Correction<textarea id="baInvCcc" placeholder="Complaint / Cause / Correction"></textarea></label><div class="ba001-actions"><button data-ba001="build-invoice">BUILD PAPER</button><button data-ba001="save-invoice">SAVE INVOICE</button><button data-ba001="copy-invoice">COPY TEXT</button><button data-ba001="print-invoice">PRINT / PDF</button></div><div id="baInvoicePaper" class="ba001-paper">Invoice paper ready.</div></section>`);
    const js=jobSummary(); if($('baInvHours')) $('baInvHours').value=js.hours.toFixed(2); if($('baInvRate')) $('baInvRate').value=settings().laborRate||135; if($('baInvTax')) $('baInvTax').value=settings().tax||0;
  }
  function enrichParts(){
    const p=$('parts'); if(!p || p.dataset.ba001) return; p.dataset.ba001='1';
    p.insertAdjacentHTML('beforeend',`<section class="ba001-panel"><span class="ba001-pill">PARTS → QUOTE/INVOICE</span><div class="ba001-grid"><label>Part / Description<input id="baPartDesc" placeholder="Water pump, NOx sensor, part #..."></label><label>Qty<input id="baPartQty" type="number" value="1"></label><label>Cost / Sell<input id="baPartPrice" type="number" step="0.01" value="0"></label></div><div class="ba001-actions"><button data-ba001="lookup-part">LOCAL LOOKUP</button><button data-ba001="save-part">ADD PART</button><button data-ba001="parts-to-invoice">SEND PARTS TO INVOICE</button></div><div class="ba001-list" id="baPartsList"></div></section>`);
  }
  function enrichScan(){
    const s=$('scan'); if(!s || s.dataset.ba001) return; s.dataset.ba001='1';
    s.insertAdjacentHTML('beforeend',`<section class="ba001-panel"><span class="ba001-pill">OCR INTAKE QUEUE</span><label>Paste scanned text / part numbers / receipt lines<textarea id="baScanText" placeholder="Paste OCR text here until live OCR backend is connected"></textarea></label><div class="ba001-actions"><button data-ba001="parse-scan">PARSE SCAN</button><button data-ba001="scan-to-parts">SEND NUMBERS TO PARTS</button><button data-ba001="save-scan">SAVE SCAN</button></div><div id="baScanOut" class="ba001-list"></div></section>`);
  }
  function enrichDebug(){
    const d=$('debug'); if(!d || d.dataset.ba001) return; d.dataset.ba001='1';
    d.insertAdjacentHTML('beforeend',`<section class="ba001-panel"><span class="ba001-pill">BA001 FINAL TEST</span><div class="ba001-actions"><button data-ba001="run-final-audit">RUN FINAL AUDIT</button><button data-ba001="export-data">EXPORT DATA</button><button data-ba001="queue-sync">QUEUE BACKEND SYNC</button></div><pre class="output" id="baAuditOut">Final wiring ready.</pre></section>`);
  }

  function renderLists(){
    const cl=$('customerList'); if(cl) cl.innerHTML=DB.customers().slice().reverse().map(c=>`<div class="ba001-row"><b>${esc(c.name||c.company||'Customer')}</b><small>${esc(c.phone||'')} ${esc(c.email||'')}</small><small>${esc(c.notes||'')}</small></div>`).join('')||'<div class="ba001-row">No customers yet.</div>';
    const sl=$('scheduleList'); if(sl) sl.innerHTML=DB.workorders().filter(w=>w.scheduled).slice().reverse().map(w=>`<div class="ba001-row"><b>${esc(w.date||'No date')} ${esc(w.time||'')}</b><small>${esc(w.customer)} — ${esc(w.type)}</small><small>${esc(w.notes)}</small></div>`).join('')||'<div class="ba001-row">No scheduled jobs yet.</div>';
    const pl=$('baPartsList'); if(pl) pl.innerHTML=DB.parts().slice().reverse().map(p=>`<div class="ba001-row"><b>${esc(p.desc)}</b><small>Qty ${p.qty} × ${money(p.price)} = ${money(p.qty*p.price)}</small><small>${esc(p.note||'')}</small></div>`).join('')||'<div class="ba001-row">No parts saved yet.</div>';
  }

  function buildInvoiceObj(){
    const st=settings(), truck=activeTruck(); const hours=Number($('baInvHours')?.value||0), rate=Number($('baInvRate')?.value||st.laborRate||135), parts=Number($('baInvParts')?.value||0), taxRate=Number($('baInvTax')?.value||st.tax||0);
    const labor=hours*rate, subtotal=labor+parts, tax=subtotal*taxRate/100, total=subtotal+tax;
    return {id:$('baInvRo')?.value||uid('INV'), date:new Date().toLocaleDateString(), customer:$('baInvCustomer')?.value||'', ccc:$('baInvCcc')?.value||'', truck, hours, rate, labor, parts, taxRate, tax, total, company:st.companyName||'Rolling Wrench Diesel', phone:st.companyPhone||'260-502-6222', website:st.companyWebsite||'www.rollingwrenchdiesel.com'};
  }
  function invoiceHtml(inv){return `<h2>${esc(inv.company)}</h2><p>${esc(inv.phone)} • ${esc(inv.website)}</p><h3>Invoice / Quote ${esc(inv.id)}</h3><p><b>Date:</b> ${esc(inv.date)} &nbsp; <b>Customer:</b> ${esc(inv.customer||'')}</p><p><b>Truck:</b> ${esc([inv.truck.year,inv.truck.make,inv.truck.model].filter(Boolean).join(' ')||'')} &nbsp; <b>VIN:</b> ${esc(inv.truck.vin||'')}</p><table><tr><th>Description</th><th>Amount</th></tr><tr><td>Labor ${inv.hours.toFixed(2)} hr @ ${money(inv.rate)}/hr</td><td>${money(inv.labor)}</td></tr><tr><td>Parts / supplies</td><td>${money(inv.parts)}</td></tr><tr><td>Tax ${inv.taxRate}%</td><td>${money(inv.tax)}</td></tr></table><p class="total">TOTAL ${money(inv.total)}</p><h3>Complaint / Cause / Correction</h3><p>${esc(inv.ccc||'')}</p><p><b>Price may vary if additional problems are found or parts pricing changes before approval.</b></p><h3>Customer Signature</h3><div class="ba001-sig">Signature: ______________________________ Date: __________</div>`;}
  function invoiceText(inv){return `${inv.company}\n${inv.phone}\nInvoice/Quote ${inv.id}\nCustomer: ${inv.customer}\nTruck: ${[inv.truck.year,inv.truck.make,inv.truck.model].filter(Boolean).join(' ')} VIN ${inv.truck.vin||''}\nLabor: ${inv.hours.toFixed(2)} hr @ ${money(inv.rate)} = ${money(inv.labor)}\nParts: ${money(inv.parts)}\nTax: ${money(inv.tax)}\nTOTAL: ${money(inv.total)}\n\n${inv.ccc||''}\n\nPrice may vary if additional problems are found or parts pricing changes before approval.`;}
  function buildInvoice(){ const inv=buildInvoiceObj(); const paper=$('baInvoicePaper'); if(paper) paper.innerHTML=invoiceHtml(inv); save('BA001_ACTIVE_INVOICE',inv); return inv; }

  async function handle(action){
    if(action==='save-customer'){
      const arr=DB.customers(); arr.push({id:uid('C'),name:$('cName')?.value||'',phone:$('cPhone')?.value||'',email:$('cEmail')?.value||'',company:$('cCompany')?.value||'',notes:$('cNotes')?.value||'',date:nowIso()}); DB.put('customers',arr); renderLists(); toast('Customer saved');
    }
    if(action==='new-workorder') { nav('workorders'); toast('Work order opened'); }
    if(action==='save-schedule'||action==='schedule-to-wo'){
      const arr=DB.workorders(); arr.push({id:uid('WO'),scheduled:true,date:$('sDate')?.value||'',time:$('sTime')?.value||'',customer:$('sCustomer')?.value||'',type:$('sType')?.value||'',notes:$('sNotes')?.value||'',truck:activeTruck(),status:'Scheduled',created:nowIso()}); DB.put('workorders',arr); renderLists(); if(action==='schedule-to-wo') nav('workorders'); toast('Job saved');
    }
    if(action==='lookup-part'){
      const q=$('baPartDesc')?.value||$('partsQuestion')?.value||''; const res=await Adapters.partsLookup(q,activeTruck()); const list=$('baPartsList'); if(list) list.innerHTML=res.suggestions.map(p=>`<div class="ba001-row"><b>${esc(p.name)}</b><small>${esc(p.note)}</small></div>`).join(''); toast('Local job kit built');
    }
    if(action==='save-part'){
      const arr=DB.parts(); arr.push({id:uid('P'),desc:$('baPartDesc')?.value||'',qty:Number($('baPartQty')?.value||1),price:Number($('baPartPrice')?.value||0),truck:activeTruck(),date:nowIso()}); DB.put('parts',arr); renderLists(); toast('Part saved');
    }
    if(action==='parts-to-invoice'){
      const total=DB.parts().reduce((s,p)=>s+(Number(p.qty||0)*Number(p.price||0)),0); nav('invoice'); setTimeout(()=>{ if($('baInvParts')) $('baInvParts').value=total.toFixed(2); buildInvoice(); },150); toast('Parts sent to invoice');
    }
    if(action==='parse-scan'){
      const data=extractParts($('baScanText')?.value||''); const out=$('baScanOut'); if(out) out.innerHTML=`<div class="ba001-row"><b>Part Numbers</b><small>${esc(data.partNumbers.join(', ')||'None found')}</small></div><div class="ba001-row"><b>Prices</b><small>${esc(data.prices.join(', ')||'None found')}</small></div>`; save('BA001_LAST_SCAN_PARSE',data); toast('Scan parsed');
    }
    if(action==='scan-to-parts'){
      const d=read('BA001_LAST_SCAN_PARSE',{partNumbers:[]}); nav('parts'); setTimeout(()=>{ if($('baPartDesc')) $('baPartDesc').value=(d.partNumbers||[]).join(', '); },150); toast('Scan sent to parts');
    }
    if(action==='save-scan') { const arr=DB.scans(); arr.push({id:uid('S'),text:$('baScanText')?.value||'',parse:read('BA001_LAST_SCAN_PARSE',{}),date:nowIso()}); DB.put('scans',arr); toast('Scan saved'); }
    if(action==='build-invoice') { buildInvoice(); toast('Invoice built'); }
    if(action==='save-invoice') { const inv=buildInvoice(); const arr=DB.invoices(); arr.push(inv); DB.put('invoices',arr); toast('Invoice saved'); }
    if(action==='copy-invoice') { const inv=read('BA001_ACTIVE_INVOICE',buildInvoiceObj()); navigator.clipboard?.writeText(invoiceText(inv)); toast('Invoice copied'); }
    if(action==='print-invoice') { buildInvoice(); window.print(); }
    if(action==='run-final-audit') finalAudit();
    if(action==='export-data') { const data=exportData(); navigator.clipboard?.writeText(JSON.stringify(data,null,2)); const out=$('baAuditOut'); if(out) out.textContent='Export copied to clipboard.\n'+JSON.stringify(data,null,2).slice(0,4000); }
    if(action==='queue-sync') { const res=await Adapters.sync(exportData()); const out=$('baAuditOut'); if(out) out.textContent=JSON.stringify(res,null,2); toast('Sync queued'); }
  }

  function exportData(){ return {version:'BA001-FINISHED-V5-LOOK',exported:nowIso(),truck:activeTruck(),settings:settings(),customers:DB.customers(),workorders:DB.workorders(),parts:DB.parts(),scans:DB.scans(),invoices:DB.invoices(),legacyJobs:read('RWD_JOBS',{})}; }
  function finalAudit(){
    const checks=[['V5 UI preserved',!!document.querySelector('.dashboard-app')],['PWA manifest',!!document.querySelector('link[rel="manifest"]')],['Customers screen',!!$('customers')],['Schedule screen',!!$('schedule')],['Invoice builder',!!$('baInvoicePaper')],['Parts to invoice',!!$('baPartDesc')],['Scan parser',!!$('baScanText')],['Backend adapters',!!window.BA001Adapters]];
    const out=$('baAuditOut'); if(out) out.textContent=checks.map(c=>`${c[1]?'PASS':'FAIL'} - ${c[0]}`).join('\n')+'\n\nData counts: '+JSON.stringify({customers:DB.customers().length,workorders:DB.workorders().length,parts:DB.parts().length,invoices:DB.invoices().length,scans:DB.scans().length});
    toast('Final audit complete');
  }
  function pulse(){ const a=$('alertCount'); if(a){ const q=read('BA001_SYNC_QUEUE',[]).length; a.textContent=String(q); } }
  function toast(msg){ if(window.showToast) window.showToast(msg); else console.log(msg); }

  document.addEventListener('click',e=>{ const b=e.target.closest('[data-ba001]'); if(!b) return; e.preventDefault(); handle(b.dataset.ba001); },true);
  document.addEventListener('DOMContentLoaded',()=>{ installModules(); renderLists(); pulse(); setTimeout(()=>{installModules(); renderLists();},700); });
  window.BA001 = {DB, Adapters, exportData, finalAudit, buildInvoice, renderLists};
})();
