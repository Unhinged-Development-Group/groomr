const fs = require('fs');

const SRC = 'documents/research/scotland-central-belt-groomer-outreach.md';
const OUT = 'documents/research/scotland-central-belt-groomer-tracker.html';

const lines = fs.readFileSync(SRC, 'utf8').split('\n');

const records = [];
let region = null, town = null, started = false, inTable = false, headerCols = null;

function splitRow(line) {
  let l = line.trim();
  if (l.startsWith('|')) l = l.slice(1);
  if (l.endsWith('|')) l = l.slice(0, -1);
  return l.split('|').map(c => c.trim());
}

for (const raw of lines) {
  const line = raw.replace(/\s+$/, '');
  const regionMatch = line.match(/^#\s+(\d+)\.\s+(.*)$/);
  if (regionMatch) { started = true; region = regionMatch[2].trim(); town = null; inTable = false; headerCols = null; continue; }
  if (!started) continue;
  const townMatch = line.match(/^##\s+(.*)$/);
  if (townMatch) { town = townMatch[1].trim(); inTable = false; headerCols = null; continue; }
  if (line.startsWith('|')) {
    const cells = splitRow(line);
    if (cells[0].toLowerCase() === 'business') { headerCols = cells.map(c => c.toLowerCase()); inTable = true; continue; }
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    if (inTable && headerCols) {
      const obj = {};
      headerCols.forEach((h, i) => { obj[h] = cells[i] || ''; });
      const business = obj['business'] || '';
      if (!business) continue;
      const notes = obj['notes'] || '';
      const emailMatch = notes.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      records.push({
        region, town, business,
        address: obj['address'] || '',
        phone: obj['phone'] || '',
        email: emailMatch ? emailMatch[1] : '',
        website: obj['website'] || '',
        social: obj['social'] || '',
        booking: obj['booking software'] || '',
        notes,
      });
    }
  } else { inTable = false; }
}

function slug(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
records.forEach((r, i) => { r.id = slug(r.region).slice(0, 8) + '-' + slug(r.town).slice(0, 10) + '-' + slug(r.business).slice(0, 20) + '-' + i; });

// --- Build a place-name -> {region, town} lookup for address-based re-filing ---
const STOP = new Set(['near','area','mobile','also','the','and','road','street','main','high','park','place','drive','avenue','crescent','terrace','court','gardens','industrial','estate','unit','units','retail','business','centre','center','salon','home','based','garden','village','farm','cottage','wynd','square','lane','bridge','quay','shore','castle','station','trading','suburbs','springburn']);
const placeMap = {};
records.forEach(r => {
  const T = r.town || '', R = r.region;
  const clean = T.replace(/\(.*?\)/g, ' ');
  clean.split(/[\/,&]/).forEach(part => {
    const tok = part.trim().toLowerCase().replace(/\s+/g, ' ');
    if (tok.length < 4) return;
    if (STOP.has(tok)) return;
    if (!/^[a-z][a-z' .-]*[a-z]$/.test(tok)) return;
    (placeMap[tok] = placeMap[tok] || new Set()).add(R + '||' + T);
  });
});
const PLACES = [];
Object.keys(placeMap).forEach(tok => {
  const s = placeMap[tok];
  if (s.size === 1) { const k = [...s][0]; const i = k.indexOf('||'); PLACES.push({ token: tok, region: k.slice(0, i), town: k.slice(i + 2) }); }
});
PLACES.sort((a, b) => b.token.length - a.token.length);

const regions = [...new Set(records.map(r => r.region))];
const generated = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Groomr · Scotland Outreach Tracker</title>
<style>
  :root{--gold:#eae45c;--slate:#2c3e50;--sage:#88a096;--pebble:#95a5a6;--cream:#f9f8f4;--terracotta:#c87964;--ink:#2c3e50;--line:#e4e2d8;}
  *{box-sizing:border-box;}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--cream);font-size:14px;line-height:1.4;}
  header.top{background:var(--slate);color:#fff;padding:18px 22px;}
  header.top h1{margin:0;font-size:20px;}
  header.top h1 .dot{color:var(--gold);}
  header.top p{margin:4px 0 0;color:#cfd8df;font-size:12px;}
  .wrap{padding:16px 22px 80px;}
  .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:6px;position:sticky;top:0;z-index:20;background:var(--cream);padding:10px 0;border-bottom:1px solid var(--line);}
  .controls input[type=search],.controls select{padding:8px 10px;border:1px solid var(--pebble);border-radius:8px;font-size:13px;background:#fff;color:var(--ink);}
  .controls input[type=search]{min-width:220px;flex:1 1 220px;}
  .stats{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;}
  .stat{background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:12px;white-space:nowrap;}
  .stat b{font-size:14px;}
  .stat.warm{background:#fce9c9;border-color:#f0d6a0;}
  .resultcount{font-size:12px;color:#6a7884;margin:6px 0 12px;font-weight:600;}
  .btn{padding:8px 12px;border:1px solid var(--slate);background:#fff;color:var(--slate);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;}
  .btn:hover{background:var(--slate);color:#fff;}
  .btn.gold{background:var(--gold);border-color:var(--gold);color:var(--slate);}
  .btn.gold:hover{filter:brightness(.95);}
  h2.region{margin:26px 0 6px;font-size:17px;color:var(--slate);border-bottom:2px solid var(--gold);padding-bottom:4px;}
  h3.town{margin:16px 0 6px;font-size:14px;color:var(--terracotta);font-weight:700;}
  table{width:100%;border-collapse:collapse;background:#fff;}
  thead th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5a6b7a;background:#f0efe7;padding:7px 8px;border-bottom:1px solid var(--line);}
  tbody td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top;}
  tbody tr:hover{background:#fbfaf4;}
  tr.done{opacity:.6;}
  tr.done .biz-input{text-decoration:line-through;}
  tr.warm{box-shadow:inset 4px 0 0 var(--gold);}
  .biz-input{font-weight:700;width:100%;border:1px solid transparent;background:transparent;border-radius:6px;padding:4px 5px;font-size:14px;font-family:inherit;color:var(--ink);}
  .biz-input:hover{border-color:var(--line);}
  .biz-input:focus{border-color:var(--pebble);background:#fff;outline:none;}
  .cfield{display:flex;align-items:center;gap:4px;margin:2px 0;}
  .cfield label{font-size:10px;text-transform:uppercase;letter-spacing:.3px;color:#9aa7b0;width:42px;flex:0 0 42px;}
  .cfield input{flex:1;border:1px solid #ece9dd;background:#fdfdfb;border-radius:6px;padding:4px 6px;font-size:12px;font-family:inherit;color:#33424e;min-width:80px;}
  .cfield input:focus{border-color:var(--pebble);background:#fff;outline:none;}
  .cfield a{font-size:12px;text-decoration:none;flex:0 0 auto;}
  .contactcell{min-width:230px;}
  .pill{display:inline-block;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;margin-bottom:3px;max-width:150px;overflow:hidden;text-overflow:ellipsis;}
  .pill.phone-social{background:#e2efe6;color:#2f6f47;}
  .pill.platform{background:#fde7df;color:#a04a2c;}
  .pill.own-site{background:#fff3c9;color:#8a6d00;}
  .pill.chain{background:#e8eaed;color:#555;}
  .pill.unknown{background:#eee;color:#777;}
  .bookcell{min-width:130px;position:relative;}
  .bookedit{margin-top:2px;}
  .bookedit summary{cursor:pointer;font-size:11px;color:var(--terracotta);font-weight:600;list-style:none;}
  .bookedit summary::-webkit-details-marker{display:none;}
  .bookopts{position:absolute;z-index:30;background:#fff;border:1px solid var(--pebble);border-radius:8px;padding:8px;box-shadow:0 10px 28px rgba(0,0,0,.18);max-height:260px;overflow:auto;width:200px;margin-top:4px;}
  .bookopts label{display:flex;gap:6px;align-items:center;font-size:12px;padding:3px 2px;font-weight:400;white-space:nowrap;cursor:pointer;}
  .orig-notes{font-size:11px;color:#8794a0;max-width:190px;}
  select.status{border:1px solid var(--pebble);border-radius:7px;padding:5px 6px;font-size:12px;font-weight:700;background:#fff;width:100%;}
  select.status.s-contacted{background:#fff7d6;}
  select.status.s-awaiting{background:#e7eefc;}
  select.status.s-interested{background:#e2efe6;}
  select.status.s-onboarded{background:#d6f0dc;}
  select.status.s-declined{background:#f3dede;}
  select.status.s-known{background:#fce9c9;}
  input.date{border:1px solid var(--pebble);border-radius:7px;padding:5px 6px;font-size:12px;width:128px;}
  textarea.usernotes{width:100%;min-width:150px;border:1px solid var(--pebble);border-radius:7px;padding:6px;font-size:12px;font-family:inherit;resize:vertical;min-height:34px;}
  .delcustom{border:none;background:none;color:var(--terracotta);cursor:pointer;font-size:15px;line-height:1;}
  .delcustom:hover{color:#a23d20;}
  .custom-badge{display:inline-block;background:var(--gold);color:var(--slate);font-size:9px;font-weight:700;border-radius:4px;padding:1px 4px;margin-left:4px;vertical-align:middle;}
  .saved-flash{position:fixed;bottom:16px;right:16px;background:var(--slate);color:#fff;padding:10px 14px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100;}
  .saved-flash.show{opacity:.95;}
  .hidden{display:none !important;}
  .modal-bg{position:fixed;inset:0;background:rgba(44,62,80,.45);display:flex;align-items:center;justify-content:center;z-index:200;}
  .modal{background:#fff;border-radius:12px;padding:22px;width:min(440px,92vw);box-shadow:0 18px 50px rgba(0,0,0,.25);}
  .modal h3{margin:0 0 4px;color:var(--slate);}
  .modal .hint{font-size:11px;color:#7a8893;margin:0 0 12px;}
  .modal .row{margin-bottom:10px;display:flex;flex-direction:column;gap:3px;}
  .modal label{font-size:11px;text-transform:uppercase;letter-spacing:.3px;color:#7a8893;}
  .modal input{padding:8px;border:1px solid var(--pebble);border-radius:8px;font-size:13px;font-family:inherit;}
  .modal .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:6px;}
  footer.note{margin-top:30px;font-size:12px;color:#7a8893;max-width:780px;}
  @media print{.controls,.btn,.delcustom,.bookedit,header.top p{display:none;}}
</style>
</head>
<body>
<header class="top">
  <h1>Groomr <span class="dot">·</span> Scotland Outreach Tracker</h1>
  <p id="subhead"></p>
</header>
<div class="wrap">
  <div class="controls">
    <input type="search" id="search" placeholder="Search business, town, address, phone, email…">
    <select id="filterRegion"><option value="">All regions</option></select>
    <select id="filterStatus">
      <option value="">Any status</option>
      <option>Not contacted</option><option>Known to Groomr</option><option>Contacted</option>
      <option>Awaiting reply</option><option>Interested</option><option>Onboarded</option><option>Not interested</option>
    </select>
    <select id="filterBooking">
      <option value="">Any booking type</option>
      <option value="phone-social">Phone/social only</option>
      <option value="platform">On a paid platform</option>
      <option value="own-site">Own-site booking</option>
      <option value="chain">Chain</option>
      <option value="unknown">Unknown</option>
    </select>
    <button class="btn gold" id="addBtn">+ Add groomer</button>
    <button class="btn" id="exportCsv">Export CSV</button>
    <button class="btn" id="exportJson">Backup</button>
    <button class="btn" id="importJson">Restore</button>
    <input type="file" id="importFile" accept="application/json" class="hidden">
    <div class="stats" id="stats"></div>
  </div>
  <div class="resultcount" id="resultcount"></div>
  <div id="list"></div>
  <footer class="note">
    Everything you change — contact details, booking platforms, status, dates, notes, and any groomers you add —
    is saved locally in this browser (<code>localStorage</code>). It is <b>not</b> synced anywhere, so use
    <b>Backup</b> regularly and <b>Restore</b> to reload it. Editing a groomer's <b>address</b> re-files it under the
    correct town automatically. <b>Known to Groomr</b> rows are flagged warm (gold edge). Edited details and added
    groomers are included in <b>Export CSV</b>.
  </footer>
</div>
<div class="saved-flash" id="flash">Saved</div>

<script>
const DATA = ${JSON.stringify(records)};
const PLACES = ${JSON.stringify(PLACES)};
const STORE_KEY = 'groomr-outreach-tracker-v2';
const CUSTOM_KEY = 'groomr-outreach-custom-v2';
const STATUSES = ['Not contacted','Known to Groomr','Contacted','Awaiting reply','Interested','Onboarded','Not interested'];
const STATUS_CLASS = {'Not contacted':'','Known to Groomr':'s-known','Contacted':'s-contacted','Awaiting reply':'s-awaiting','Interested':'s-interested','Onboarded':'s-onboarded','Not interested':'s-declined'};
const ENGAGED = ['Contacted','Awaiting reply','Interested','Onboarded'];
const BOOKING_OPTIONS = [
  {label:'Phone / social only', match:['phone','social','whatsapp',' dm']},
  {label:'Booksy', match:['booksy']},
  {label:'Fresha', match:['fresha']},
  {label:'MoeGo', match:['moego']},
  {label:'Savvy Pet Spa', match:['savvy','itsallsavvy']},
  {label:'Setmore', match:['setmore']},
  {label:'Square Appointments', match:['square']},
  {label:'SumUp Bookings', match:['sumup']},
  {label:'HeyGoldie', match:['heygoldie','goldie']},
  {label:'Treatwell', match:['treatwell']},
  {label:'Vagaro', match:['vagaro']},
  {label:'Acuity', match:['acuity']},
  {label:'Own-site booking', match:['own-site','website','book online','book an appointment','book now']},
  {label:'Pets at Home (chain)', match:['pets at home','propet','chain']},
  {label:'Unknown', match:['unknown','not found']}
];

let store = {}, custom = [];
try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e){ store = {}; }
try { custom = JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; } catch(e){ custom = []; }
try {
  const v1 = JSON.parse(localStorage.getItem('groomr-outreach-tracker-v1'));
  if(v1 && !Object.keys(store).length){ for(const k in v1){ store[k]={status:v1[k].status||'Not contacted',date:v1[k].date||'',notes:v1[k].notes||'',fields:{}}; } }
} catch(e){}

function allRecords(){ return DATA.concat(custom); }
function baseById(id){ return allRecords().find(r=>r.id===id); }
function rec(id){ if(!store[id]) store[id]={status:'Not contacted',date:'',notes:'',fields:{}}; if(!store[id].fields) store[id].fields={}; return store[id]; }
function val(r,key){ const o=store[r.id]; return (o&&o.fields&&o.fields[key]!==undefined)?o.fields[key]:(r[key]||''); }

function save(){ localStorage.setItem(STORE_KEY,JSON.stringify(store)); localStorage.setItem(CUSTOM_KEY,JSON.stringify(custom)); flash(); updateStats(); }
let flashTimer;
function flash(){ const f=document.getElementById('flash'); f.classList.add('show'); clearTimeout(flashTimer); flashTimer=setTimeout(()=>f.classList.remove('show'),900); }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function blank(v){ return !v || /^(not found|unknown|n\\/a|—|-)$/i.test(String(v).trim()); }

function bookingCategory(b){
  const t=(b||'').toLowerCase();
  if(blank(b)) return 'unknown';
  const named=['booksy','fresha','moego','savvy','setmore','square','sumup','heygoldie','goldie','treatwell','vagaro','acuity','ovatu','timely'];
  if(named.some(n=>t.includes(n))) return 'platform';
  if(t.includes('pets at home')||t.includes('propet')||t.includes('chain')) return 'chain';
  if(t.includes('own-site')||t.includes('website')||t.includes('book online')||t.includes('book an appointment')||t.includes('book now')) return 'own-site';
  if(t.includes('phone')||t.includes('social')||t.includes('whatsapp')) return 'phone-social';
  return 'unknown';
}
function bookingChecked(b){ const t=(b||'').toLowerCase(); return BOOKING_OPTIONS.filter(o=>o.match.some(m=>t.includes(m))).map(o=>o.label); }

function isAlpha(c){ return c && c>='a' && c<='z'; }
function inferLocation(address){
  if(!address) return null;
  const a=' '+address.toLowerCase().replace(/[^a-z0-9' .-]/g,' ')+' ';
  for(const p of PLACES){
    let idx=a.indexOf(p.token);
    while(idx!==-1){
      if(!isAlpha(a[idx-1]) && !isAlpha(a[idx+p.token.length])) return {region:p.region, town:p.town};
      idx=a.indexOf(p.token, idx+1);
    }
  }
  return null;
}

function regionOptions(){ const order=[]; allRecords().forEach(r=>{ const reg=val(r,'region'); if(!order.includes(reg)) order.push(reg); }); return order; }

function cfield(r,key,label,linkType){
  const v=val(r,key);
  let link='';
  if(!blank(v)){
    if(linkType==='tel'){ const t=v.replace(/[^0-9+]/g,''); if(t) link='<a href="tel:'+t+'" title="Call">📞</a>'; }
    else if(linkType==='mailto'){ link='<a href="mailto:'+esc(v.trim())+'" title="Email">✉️</a>'; }
    else if(linkType==='web'){ const m=v.match(/([a-z0-9.-]+\\.[a-z]{2,}(?:\\/[^\\s)]*)?)/i); if(m) link='<a href="https://'+m[1].replace(/^https?:\\/\\//,'')+'" target="_blank" rel="noopener" title="Open">🌐</a>'; }
  }
  return '<div class="cfield"><label>'+label+'</label><input data-field="'+key+'" value="'+esc(v)+'" placeholder="—">'+link+'</div>';
}

function buildGroups(filtered){
  const rOrder=regionOptions();
  const map={};
  filtered.forEach(r=>{ const reg=val(r,'region'), tn=val(r,'town'); (map[reg]=map[reg]||{}); (map[reg][tn]=map[reg][tn]||[]).push(r); });
  const groups=[];
  rOrder.forEach(reg=>{
    if(!map[reg]) return;
    const tOrder=[]; allRecords().forEach(r=>{ if(val(r,'region')===reg){ const tn=val(r,'town'); if(!tOrder.includes(tn)) tOrder.push(tn); } });
    const towns=[];
    tOrder.forEach(tn=>{ if(map[reg][tn]) towns.push({town:tn,rows:map[reg][tn]}); });
    groups.push({region:reg,towns});
  });
  return groups;
}

function rowHtml(r){
  const t=rec(r.id);
  const done=(t.status==='Onboarded'||t.status==='Not interested');
  const warm=(t.status==='Known to Groomr');
  const bval=val(r,'booking'); const cat=bookingCategory(bval); const checked=bookingChecked(bval);
  const pillText=blank(bval)?cat:(bval.length>24?bval.slice(0,22)+'…':bval);
  const isCustom=r.id.indexOf('custom-')===0;
  return '<tr class="'+(done?'done ':'')+(warm?'warm':'')+'" data-id="'+r.id+'">'+
    '<td><input class="biz-input" data-field="business" value="'+esc(val(r,'business'))+'">'+(isCustom?'<span class="custom-badge">added</span>':'')+'</td>'+
    '<td class="contactcell">'+cfield(r,'address','Addr','')+cfield(r,'phone','Tel','tel')+cfield(r,'email','Email','mailto')+cfield(r,'website','Web','web')+cfield(r,'social','Social','')+'</td>'+
    '<td class="bookcell"><span class="pill '+cat+'" data-pill title="'+esc(bval)+'">'+esc(pillText)+'</span>'+
      '<details class="bookedit"><summary>edit ▾</summary><div class="bookopts">'+
        BOOKING_OPTIONS.map(o=>'<label><input type="checkbox" data-bookopt value="'+esc(o.label)+'"'+(checked.indexOf(o.label)>=0?' checked':'')+'> '+esc(o.label)+'</label>').join('')+
      '</div></details></td>'+
    '<td class="orig-notes">'+esc(r.notes)+'</td>'+
    '<td><select class="status '+STATUS_CLASS[t.status]+'" data-field="status">'+STATUSES.map(s=>'<option'+(s===t.status?' selected':'')+'>'+s+'</option>').join('')+'</select></td>'+
    '<td><input class="date" type="date" data-field="date" value="'+esc(t.date)+'"></td>'+
    '<td><textarea class="usernotes" data-field="notes" placeholder="Notes…">'+esc(t.notes)+'</textarea></td>'+
    '<td>'+(isCustom?'<button class="delcustom" title="Remove this added groomer">✕</button>':'')+'</td>'+
  '</tr>';
}

function render(){
  const list=document.getElementById('list');
  const q=document.getElementById('search').value.trim().toLowerCase();
  const fRegion=document.getElementById('filterRegion').value;
  const fStatus=document.getElementById('filterStatus').value;
  const fBooking=document.getElementById('filterBooking').value;

  const filtered=allRecords().filter(r=>{
    if(fRegion && val(r,'region')!==fRegion) return false;
    if(fBooking && bookingCategory(val(r,'booking'))!==fBooking) return false;
    const st=rec(r.id).status;
    if(fStatus && st!==fStatus) return false;
    if(q){
      const t=rec(r.id);
      const hay=(val(r,'business')+' '+val(r,'town')+' '+val(r,'address')+' '+val(r,'phone')+' '+val(r,'email')+' '+val(r,'website')+' '+val(r,'social')+' '+val(r,'booking')+' '+t.notes).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  let html='';
  buildGroups(filtered).forEach(g=>{
    html+='<h2 class="region">'+esc(g.region)+'</h2>';
    g.towns.forEach(tg=>{
      html+='<h3 class="town">'+esc(tg.town||'')+'</h3>';
      html+='<table><thead><tr><th>Business</th><th>Contact details</th><th>Booking</th><th>Source notes</th><th>Status</th><th>Last contacted</th><th>My notes</th><th></th></tr></thead><tbody>';
      tg.rows.forEach(r=>{ html+=rowHtml(r); });
      html+='</tbody></table>';
    });
  });
  if(!filtered.length) html='<p style="padding:30px;color:#888">No groomers match your filters.</p>';
  list.innerHTML=html;

  const total=allRecords().length;
  const anyFilter=(q||fRegion||fStatus||fBooking);
  document.getElementById('resultcount').textContent='Showing '+filtered.length+' of '+total+' groomers'+(anyFilter?' (filtered)':'');
  updateStats();
}

function updateStats(){
  const all=allRecords();
  let contacted=0,interested=0,onboarded=0,known=0,phonesocial=0;
  all.forEach(r=>{ const st=(store[r.id]&&store[r.id].status)||'Not contacted';
    if(ENGAGED.indexOf(st)>=0) contacted++;
    if(st==='Interested') interested++;
    if(st==='Onboarded') onboarded++;
    if(st==='Known to Groomr') known++;
    if(bookingCategory(val(r,'booking'))==='phone-social') phonesocial++; });
  document.getElementById('stats').innerHTML=
    '<span class="stat"><b>'+all.length+'</b> total</span>'+
    '<span class="stat warm"><b>'+known+'</b> known to Groomr</span>'+
    '<span class="stat"><b>'+phonesocial+'</b> phone/social</span>'+
    '<span class="stat"><b>'+contacted+'</b> contacted</span>'+
    '<span class="stat"><b>'+interested+'</b> interested</span>'+
    '<span class="stat"><b>'+onboarded+'</b> onboarded</span>';
}

function refreshSubhead(){ document.getElementById('subhead').innerHTML=allRecords().length+' groomers · generated ${generated} · edits &amp; notes save automatically in this browser'; }
function refreshRegionFilter(){
  const sel=document.getElementById('filterRegion'); const cur=sel.value;
  sel.innerHTML='<option value="">All regions</option>'+regionOptions().map(r=>'<option'+(r===cur?' selected':'')+'>'+esc(r)+'</option>').join('');
}

document.getElementById('list').addEventListener('input',e=>{
  const row=e.target.closest('tr'); if(!row) return;
  const id=row.dataset.id, field=e.target.dataset.field; if(!field) return;
  const t=rec(id);
  if(field==='status'){ t.status=e.target.value; e.target.className='status '+STATUS_CLASS[e.target.value]; row.classList.toggle('done', e.target.value==='Onboarded'||e.target.value==='Not interested'); row.classList.toggle('warm', e.target.value==='Known to Groomr'); }
  else if(field==='date'||field==='notes'){ t[field]=e.target.value; }
  else { t.fields[field]=e.target.value; }
  save();
});

document.getElementById('list').addEventListener('change',e=>{
  const row=e.target.closest('tr'); if(!row) return;
  const id=row.dataset.id;
  if(e.target.dataset.bookopt!==undefined){
    const details=e.target.closest('.bookedit');
    const str=[...details.querySelectorAll('input[data-bookopt]:checked')].map(i=>i.value).join(', ');
    rec(id).fields.booking=str;
    const pill=row.querySelector('[data-pill]'); const cat=bookingCategory(str);
    pill.className='pill '+cat; pill.title=str; pill.textContent=blank(str)?cat:(str.length>24?str.slice(0,22)+'…':str);
    save(); return;
  }
  if(e.target.dataset.field==='address'){
    const r=baseById(id); const loc=inferLocation(e.target.value);
    if(loc && (loc.town!==val(r,'town')||loc.region!==val(r,'region'))){
      const t=rec(id); t.fields.region=loc.region; t.fields.town=loc.town; save(); refreshRegionFilter(); render();
      const el=document.querySelector('tr[data-id="'+id+'"]');
      if(el){ el.scrollIntoView({block:'center'}); el.style.transition='background .9s'; el.style.background='#fff7d6'; setTimeout(()=>{el.style.background='';},1000); }
      return;
    }
  }
  if(e.target.dataset.field) save();
});

document.getElementById('list').addEventListener('click',e=>{
  if(e.target.classList.contains('delcustom')){
    const row=e.target.closest('tr'); const id=row.dataset.id;
    if(confirm('Remove this added groomer?')){ custom=custom.filter(c=>c.id!==id); delete store[id]; save(); render(); refreshRegionFilter(); refreshSubhead(); }
  }
});
['search','filterRegion','filterStatus','filterBooking'].forEach(id=>document.getElementById(id).addEventListener('input',render));

document.getElementById('addBtn').addEventListener('click',()=>{
  const bg=document.createElement('div'); bg.className='modal-bg';
  const regs=regionOptions();
  bg.innerHTML='<div class="modal"><h3>Add a groomer</h3><p class="hint">Enter an address and leave Region/Town blank to auto-file it.</p>'+
    '<div class="row"><label>Region</label><input id="m_region" list="m_regions" placeholder="auto from address if blank"><datalist id="m_regions">'+regs.map(r=>'<option value="'+esc(r)+'">').join('')+'</datalist></div>'+
    '<div class="row"><label>Town / area</label><input id="m_town" placeholder="auto from address if blank"></div>'+
    '<div class="row"><label>Business name *</label><input id="m_business" placeholder="Business name"></div>'+
    '<div class="row"><label>Address</label><input id="m_address"></div>'+
    '<div class="row"><label>Phone</label><input id="m_phone"></div>'+
    '<div class="row"><label>Email</label><input id="m_email"></div>'+
    '<div class="row"><label>Website</label><input id="m_website"></div>'+
    '<div class="actions"><button class="btn" id="m_cancel">Cancel</button><button class="btn gold" id="m_save">Add</button></div></div>';
  document.body.appendChild(bg);
  const close=()=>bg.remove();
  bg.addEventListener('click',e=>{ if(e.target===bg) close(); });
  bg.querySelector('#m_cancel').addEventListener('click',close);
  bg.querySelector('#m_save').addEventListener('click',()=>{
    const business=bg.querySelector('#m_business').value.trim();
    if(!business){ alert('Business name is required.'); return; }
    const address=bg.querySelector('#m_address').value.trim();
    let region=bg.querySelector('#m_region').value.trim();
    let townv=bg.querySelector('#m_town').value.trim();
    if((!region||!townv) && address){ const loc=inferLocation(address); if(loc){ region=region||loc.region; townv=townv||loc.town; } }
    const r={ id:'custom-'+Date.now()+'-'+Math.floor(Math.random()*1000),
      region:(region||'My additions'), town:(townv||'—'), business, address,
      phone:bg.querySelector('#m_phone').value.trim(), email:bg.querySelector('#m_email').value.trim(),
      website:bg.querySelector('#m_website').value.trim(), social:'', booking:'', notes:'' };
    custom.push(r); rec(r.id); save(); close(); refreshRegionFilter(); refreshSubhead(); render();
    const el=document.querySelector('tr[data-id="'+r.id+'"]'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
  });
});

document.getElementById('exportJson').addEventListener('click',()=>{
  const payload={tracking:store,custom:custom,exported:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='groomr-outreach-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click();
});
document.getElementById('importJson').addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ try{ const data=JSON.parse(reader.result);
    if(confirm('Restore from this backup? This overwrites current edits, status and added groomers.')){
      if(data.tracking){ store=data.tracking; custom=data.custom||[]; } else { store=data; }
      save(); refreshRegionFilter(); refreshSubhead(); render();
    }
  }catch(err){ alert('Could not read that file: '+err.message); } };
  reader.readAsText(file);
});
document.getElementById('exportCsv').addEventListener('click',()=>{
  const cols=['Region','Town','Business','Address','Phone','Email','Website','Social','Booking software','Source notes','Status','Last contacted','My notes'];
  const rows=allRecords().map(r=>{ const t=rec(r.id);
    return [val(r,'region'),val(r,'town'),val(r,'business'),val(r,'address'),val(r,'phone'),val(r,'email'),val(r,'website'),val(r,'social'),val(r,'booking'),r.notes,t.status,t.date,t.notes]; });
  const csv=[cols].concat(rows).map(row=>row.map(c=>{ const s=(c==null?'':String(c)); return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='groomr-outreach-'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
});

refreshRegionFilter(); refreshSubhead(); render();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log('Wrote ' + OUT);
console.log('Parsed ' + records.length + ' records across ' + regions.length + ' regions.');
console.log('Place tokens for address auto-filing: ' + PLACES.length);
console.log('Emails auto-extracted from notes: ' + records.filter(r => r.email).length);
