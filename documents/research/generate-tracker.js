const fs = require('fs');

const SRC = 'documents/research/scotland-central-belt-groomer-outreach.md';
const OUT = 'documents/research/scotland-central-belt-groomer-tracker.html';

const lines = fs.readFileSync(SRC, 'utf8').split('\n');

const records = [];
let region = null;
let town = null;
let started = false;       // only collect after first "# 1." region header
let inTable = false;
let headerCols = null;

function splitRow(line) {
  // strip leading/trailing pipe, split on |
  let l = line.trim();
  if (l.startsWith('|')) l = l.slice(1);
  if (l.endsWith('|')) l = l.slice(0, -1);
  return l.split('|').map(c => c.trim());
}

for (const raw of lines) {
  const line = raw.replace(/\s+$/, '');

  const regionMatch = line.match(/^#\s+(\d+)\.\s+(.*)$/);
  if (regionMatch) {
    started = true;
    region = regionMatch[2].trim();
    town = null;
    inTable = false;
    headerCols = null;
    continue;
  }
  if (!started) continue;

  const townMatch = line.match(/^##\s+(.*)$/);
  if (townMatch) {
    town = townMatch[1].trim();
    inTable = false;
    headerCols = null;
    continue;
  }

  if (line.startsWith('|')) {
    const cells = splitRow(line);
    // header row?
    if (cells[0].toLowerCase() === 'business') {
      headerCols = cells.map(c => c.toLowerCase());
      inTable = true;
      continue;
    }
    // separator row?
    if (/^-{2,}$/.test(cells[0].replace(/\s/g, '')) || cells.every(c => /^:?-+:?$/.test(c))) {
      continue;
    }
    if (inTable && headerCols) {
      const obj = {};
      headerCols.forEach((h, i) => { obj[h] = cells[i] || ''; });
      const business = obj['business'] || '';
      if (!business) continue;
      records.push({
        region,
        town,
        business,
        address: obj['address'] || '',
        phone: obj['phone'] || '',
        website: obj['website'] || '',
        social: obj['social'] || '',
        booking: obj['booking software'] || '',
        notes: obj['notes'] || '',
      });
    }
  } else {
    inTable = false;
  }
}

// stable id
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
records.forEach((r, i) => {
  r.id = slug(r.region).slice(0, 8) + '-' + slug(r.town || '').slice(0, 10) + '-' + slug(r.business).slice(0, 24) + '-' + i;
});

// classify booking software into a normalized category for filtering/colouring
function bookingCategory(b) {
  const t = (b || '').toLowerCase();
  if (!t || t === 'unknown' || t === 'n/a' || t === '—' || t === '-' || t.includes('not found')) return 'unknown';
  if (t.includes('phone') || t.includes('social') || t.includes('whatsapp')) return 'phone-social';
  if (t.includes('pets at home') || t.includes('propet')) return 'chain';
  // named third-party platforms
  const named = ['booksy', 'fresha', 'moego', 'savvy', 'setmore', 'square', 'sumup', 'heygoldie', 'goldie', 'treatwell', 'vagaro', 'acuity', 'ovatu', 'timely'];
  if (named.some(n => t.includes(n))) return 'platform';
  if (t.includes('book')) return 'own-site';
  return 'unknown';
}
records.forEach(r => { r.bookingCat = bookingCategory(r.booking); });

const regions = [...new Set(records.map(r => r.region))];

const generated = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Groomr · Central Scotland Outreach Tracker</title>
<style>
  :root {
    --gold: #eae45c;
    --slate: #2c3e50;
    --sage: #88a096;
    --pebble: #95a5a6;
    --cream: #f9f8f4;
    --terracotta: #c87964;
    --ink: #2c3e50;
    --line: #e4e2d8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: var(--cream);
    font-size: 14px;
    line-height: 1.4;
  }
  header.top {
    background: var(--slate);
    color: #fff;
    padding: 18px 22px;
  }
  header.top h1 { margin: 0; font-size: 20px; letter-spacing: .2px; }
  header.top h1 .dot { color: var(--gold); }
  header.top p { margin: 4px 0 0; color: #cfd8df; font-size: 12px; }
  .wrap { padding: 16px 22px 60px; }
  .controls {
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
    margin-bottom: 14px;
    position: sticky; top: 0; z-index: 20;
    background: var(--cream);
    padding: 10px 0; border-bottom: 1px solid var(--line);
  }
  .controls input[type=search], .controls select {
    padding: 8px 10px; border: 1px solid var(--pebble); border-radius: 8px;
    font-size: 13px; background: #fff; color: var(--ink);
  }
  .controls input[type=search] { min-width: 240px; flex: 1 1 240px; }
  .stats { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }
  .stat {
    background: #fff; border: 1px solid var(--line); border-radius: 8px;
    padding: 6px 10px; font-size: 12px; white-space: nowrap;
  }
  .stat b { font-size: 14px; }
  .btn {
    padding: 8px 12px; border: 1px solid var(--slate); background: #fff; color: var(--slate);
    border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
  }
  .btn:hover { background: var(--slate); color: #fff; }
  .btn.gold { background: var(--gold); border-color: var(--gold); color: var(--slate); }
  .btn.gold:hover { filter: brightness(.95); }
  h2.region {
    margin: 26px 0 6px; font-size: 17px; color: var(--slate);
    border-bottom: 2px solid var(--gold); padding-bottom: 4px;
  }
  h3.town { margin: 16px 0 6px; font-size: 14px; color: var(--terracotta); font-weight: 700; }
  table { width: 100%; border-collapse: collapse; background: #fff; }
  thead th {
    text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .4px;
    color: #5a6b7a; background: #f0efe7; padding: 7px 8px; border-bottom: 1px solid var(--line);
    position: sticky; top: 56px; z-index: 5;
  }
  tbody td { padding: 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tbody tr:hover { background: #fbfaf4; }
  tr.done { opacity: .55; }
  tr.done td.biz { text-decoration: line-through; }
  td.biz { font-weight: 700; min-width: 150px; }
  td.contact { font-size: 12.5px; color: #44525e; min-width: 140px; }
  td.contact a { color: var(--terracotta); text-decoration: none; }
  td.contact a:hover { text-decoration: underline; }
  .pill {
    display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-weight: 700;
    white-space: nowrap;
  }
  .pill.phone-social { background: #e2efe6; color: #2f6f47; }
  .pill.platform { background: #fde7df; color: #a04a2c; }
  .pill.own-site { background: #fff3c9; color: #8a6d00; }
  .pill.chain { background: #e8eaed; color: #555; }
  .pill.unknown { background: #eee; color: #777; }
  .orig-notes { font-size: 12px; color: #6a7884; max-width: 240px; }
  select.status {
    border: 1px solid var(--pebble); border-radius: 7px; padding: 5px 6px; font-size: 12px;
    font-weight: 700; background: #fff; width: 100%;
  }
  select.status.s-contacted { background: #fff7d6; }
  select.status.s-awaiting { background: #e7eefc; }
  select.status.s-interested { background: #e2efe6; }
  select.status.s-onboarded { background: #d6f0dc; }
  select.status.s-declined { background: #f3dede; }
  input.date { border: 1px solid var(--pebble); border-radius: 7px; padding: 5px 6px; font-size: 12px; width: 130px; }
  textarea.usernotes {
    width: 100%; min-width: 180px; border: 1px solid var(--pebble); border-radius: 7px;
    padding: 6px; font-size: 12px; font-family: inherit; resize: vertical; min-height: 34px;
  }
  .track-cols { min-width: 150px; }
  .saved-flash {
    position: fixed; bottom: 16px; right: 16px; background: var(--slate); color: #fff;
    padding: 10px 14px; border-radius: 8px; font-size: 13px; opacity: 0;
    transition: opacity .3s; pointer-events: none; z-index: 100;
  }
  .saved-flash.show { opacity: .95; }
  .hidden { display: none !important; }
  footer.note { margin-top: 30px; font-size: 12px; color: #7a8893; max-width: 760px; }
  @media print {
    .controls, .btn, header.top p { display: none; }
    .track-cols { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<header class="top">
  <h1>Groomr <span class="dot">·</span> Central Scotland Outreach Tracker</h1>
  <p>${records.length} groomers across ${regions.length} regions · generated ${generated} · your status &amp; notes save automatically in this browser</p>
</header>

<div class="wrap">
  <div class="controls">
    <input type="search" id="search" placeholder="Search business, town, address, phone…">
    <select id="filterRegion"><option value="">All regions</option>${regions.map(r => `<option value="${r.replace(/"/g, '&quot;')}">${r}</option>`).join('')}</select>
    <select id="filterStatus">
      <option value="">Any status</option>
      <option value="Not contacted">Not contacted</option>
      <option value="Contacted">Contacted</option>
      <option value="Awaiting reply">Awaiting reply</option>
      <option value="Interested">Interested</option>
      <option value="Onboarded">Onboarded</option>
      <option value="Not interested">Not interested</option>
    </select>
    <select id="filterBooking">
      <option value="">Any booking type</option>
      <option value="phone-social">Phone/social only (warm)</option>
      <option value="platform">On a paid platform</option>
      <option value="own-site">Own-site booking</option>
      <option value="chain">Chain</option>
      <option value="unknown">Unknown</option>
    </select>
    <button class="btn" id="exportCsv">Export CSV</button>
    <button class="btn" id="exportJson">Backup</button>
    <button class="btn" id="importJson">Restore</button>
    <input type="file" id="importFile" accept="application/json" class="hidden">
    <div class="stats" id="stats"></div>
  </div>

  <div id="list"></div>

  <footer class="note">
    Tracking data (status, last-contacted date, your notes) is stored locally in this browser via
    <code>localStorage</code>. It is <b>not</b> synced anywhere — use <b>Backup</b> regularly to save a JSON
    copy, and <b>Restore</b> to load it on another machine. Source contact details were gathered from public
    listings; verify phone numbers before contacting. The "Booking" pill shows what software a groomer already
    uses — green <b>phone/social only</b> groomers are the warmest prospects.
  </footer>
</div>

<div class="saved-flash" id="flash">Saved</div>

<script>
const DATA = ${JSON.stringify(records)};
const STORE_KEY = 'groomr-outreach-tracker-v1';
const STATUSES = ['Not contacted','Contacted','Awaiting reply','Interested','Onboarded','Not interested'];
const STATUS_CLASS = {
  'Not contacted':'', 'Contacted':'s-contacted', 'Awaiting reply':'s-awaiting',
  'Interested':'s-interested', 'Onboarded':'s-onboarded', 'Not interested':'s-declined'
};

let store = {};
try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e) { store = {}; }

function rec(id){ if(!store[id]) store[id] = {status:'Not contacted', date:'', notes:''}; return store[id]; }
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(store)); flash(); updateStats(); }

let flashTimer;
function flash(){
  const f = document.getElementById('flash');
  f.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(()=>f.classList.remove('show'), 900);
}

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function linkify(val, kind){
  const v = (val||'').trim();
  if(!v || /^(not found|unknown|n\\/a|—|-)$/i.test(v)) return '';
  if(kind==='website'){
    const m = v.match(/([a-z0-9.-]+\\.[a-z]{2,}(?:\\/[^\\s)]*)?)/i);
    if(m){ const u = m[1]; return '<a href="https://'+u.replace(/^https?:\\/\\//,'')+'" target="_blank" rel="noopener">'+esc(u)+'</a>'; }
    return esc(v);
  }
  if(kind==='phone'){
    const tel = v.replace(/[^0-9+]/g,'');
    return v.split(/\\s*\\/\\s*/).map(p=>{
      const t=p.replace(/[^0-9+]/g,''); return t?'<a href="tel:'+t+'">'+esc(p.trim())+'</a>':esc(p.trim());
    }).join(' / ');
  }
  return esc(v);
}

function bookingPill(r){
  const labels = {'phone-social':'Phone/social','platform':'Paid platform','own-site':'Own-site','chain':'Chain','unknown':'Unknown'};
  const txt = (r.booking && !/^(unknown|not found|—|-)$/i.test(r.booking)) ? r.booking : labels[r.bookingCat];
  return '<span class="pill '+r.bookingCat+'" title="'+esc(r.booking||'')+'">'+esc(txt)+'</span>';
}

function render(){
  const list = document.getElementById('list');
  const q = document.getElementById('search').value.trim().toLowerCase();
  const fRegion = document.getElementById('filterRegion').value;
  const fStatus = document.getElementById('filterStatus').value;
  const fBooking = document.getElementById('filterBooking').value;

  let html = '';
  let lastRegion = null, lastTown = null, openTable = false;

  const filtered = DATA.filter(r=>{
    if(fRegion && r.region !== fRegion) return false;
    if(fBooking && r.bookingCat !== fBooking) return false;
    const st = rec(r.id).status;
    if(fStatus && st !== fStatus) return false;
    if(q){
      const hay = (r.business+' '+r.town+' '+r.address+' '+r.phone+' '+r.website+' '+r.social+' '+r.booking+' '+rec(r.id).notes).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  function closeTable(){ if(openTable){ html += '</tbody></table>'; openTable=false; } }

  filtered.forEach(r=>{
    if(r.region !== lastRegion){
      closeTable(); lastTown=null;
      html += '<h2 class="region">'+esc(r.region)+'</h2>';
      lastRegion = r.region;
    }
    if(r.town !== lastTown){
      closeTable();
      html += '<h3 class="town">'+esc(r.town||'')+'</h3>';
      html += '<table><thead><tr>'+
        '<th>Business</th><th>Contact</th><th>Booking</th><th>Source notes</th>'+
        '<th class="track-cols">Status</th><th>Last contacted</th><th>My notes</th>'+
        '</tr></thead><tbody>';
      openTable = true; lastTown = r.town;
    }
    const t = rec(r.id);
    const done = (t.status==='Onboarded'||t.status==='Not interested');
    const contactBits = [];
    const ph = linkify(r.phone,'phone'); if(ph) contactBits.push('📞 '+ph);
    const web = linkify(r.website,'website'); if(web) contactBits.push('🌐 '+web);
    const soc = esc(r.social && !/^(not found|unknown|—|-)$/i.test(r.social)?r.social:''); if(soc) contactBits.push('👥 '+soc);
    const addr = esc(r.address && !/^(not found|unknown|—|-)$/i.test(r.address)?r.address:'');

    html += '<tr class="'+(done?'done':'')+'" data-id="'+r.id+'">'+
      '<td class="biz">'+esc(r.business)+(addr?'<div style="font-weight:400;font-size:12px;color:#6a7884">'+addr+'</div>':'')+'</td>'+
      '<td class="contact">'+(contactBits.join('<br>')||'<span style="color:#aaa">—</span>')+'</td>'+
      '<td>'+bookingPill(r)+'</td>'+
      '<td class="orig-notes">'+esc(r.notes)+'</td>'+
      '<td><select class="status '+STATUS_CLASS[t.status]+'" data-field="status">'+
        STATUSES.map(s=>'<option'+(s===t.status?' selected':'')+'>'+s+'</option>').join('')+
      '</select></td>'+
      '<td><input class="date" type="date" data-field="date" value="'+esc(t.date)+'"></td>'+
      '<td><textarea class="usernotes" data-field="notes" placeholder="Notes…">'+esc(t.notes)+'</textarea></td>'+
    '</tr>';
  });
  closeTable();

  if(!filtered.length) html = '<p style="padding:30px;color:#888">No groomers match your filters.</p>';
  list.innerHTML = html;
  updateStats();
}

function updateStats(){
  const counts = {total:DATA.length, contacted:0, interested:0, onboarded:0, warm:0};
  DATA.forEach(r=>{
    const st = (store[r.id]&&store[r.id].status)||'Not contacted';
    if(st!=='Not contacted') counts.contacted++;
    if(st==='Interested') counts.interested++;
    if(st==='Onboarded') counts.onboarded++;
    if(r.bookingCat==='phone-social') counts.warm++;
  });
  document.getElementById('stats').innerHTML =
    '<span class="stat"><b>'+counts.total+'</b> total</span>'+
    '<span class="stat"><b>'+counts.warm+'</b> warm leads</span>'+
    '<span class="stat"><b>'+counts.contacted+'</b> contacted</span>'+
    '<span class="stat"><b>'+counts.interested+'</b> interested</span>'+
    '<span class="stat"><b>'+counts.onboarded+'</b> onboarded</span>';
}

document.getElementById('list').addEventListener('input', e=>{
  const row = e.target.closest('tr'); if(!row) return;
  const id = row.dataset.id; const field = e.target.dataset.field; if(!field) return;
  const t = rec(id); t[field] = e.target.value;
  if(field==='status'){
    e.target.className = 'status '+STATUS_CLASS[e.target.value];
    const done = (e.target.value==='Onboarded'||e.target.value==='Not interested');
    row.classList.toggle('done', done);
  }
  save();
});
document.getElementById('list').addEventListener('change', e=>{ if(e.target.dataset.field) save(); });

['search','filterRegion','filterStatus','filterBooking'].forEach(id=>{
  document.getElementById(id).addEventListener('input', render);
});

document.getElementById('exportJson').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(store,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'groomr-outreach-tracking-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
});
document.getElementById('importJson').addEventListener('click', ()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(confirm('Restore tracking data from this file? This overwrites current status/notes.')){
        store = data; save(); render();
      }
    }catch(err){ alert('Could not read that file: '+err.message); }
  };
  reader.readAsText(file);
});

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const cols = ['Region','Town','Business','Address','Phone','Website','Social','Booking software','Source notes','Status','Last contacted','My notes'];
  const rows = DATA.map(r=>{
    const t = rec(r.id);
    return [r.region,r.town,r.business,r.address,r.phone,r.website,r.social,r.booking,r.notes,t.status,t.date,t.notes];
  });
  const csv = [cols].concat(rows).map(row=>row.map(c=>{
    const s = (c==null?'':String(c));
    return /[",\\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(',')).join('\\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'groomr-outreach-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
});

render();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log('Wrote ' + OUT);
console.log('Parsed ' + records.length + ' groomer records across ' + regions.length + ' regions.');
const byCat = {};
records.forEach(r => byCat[r.bookingCat] = (byCat[r.bookingCat]||0)+1);
console.log('Booking categories:', JSON.stringify(byCat));
