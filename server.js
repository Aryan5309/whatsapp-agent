const express = require('express');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 7860;

// Fetch polyfill for node 16 if needed (though HF uses node 18+)
// const fetch = require('node-fetch'); // Not needed if Node >= 18

// ─── Status API ─────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    // 1. Check Business Bot (File-based)
    let biz = { id: 'business', status: 'booting', qr: null, age: 0 };
    try {
        if (fs.existsSync('business_qr.txt')) {
            const raw = fs.readFileSync('business_qr.txt', 'utf8').trim();
            if (raw) {
                const qrBase64 = await QRCode.toDataURL(raw, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
                const age = Math.floor((Date.now() - fs.statSync('business_qr.txt').mtime.getTime()) / 1000);
                biz = { id: 'business', status: 'qr', qr: qrBase64, age };
            }
        } else {
            biz = { id: 'business', status: 'online' }; // File deleted means ready
        }
    } catch (e) {}

    // 2. Check Simulators (Proxy to port 3001 internal API)
    let simulators = [];
    try {
        const r = await fetch('http://localhost:3001/api/internal/bots');
        const data = await r.json();
        for (const b of data) {
            let sim = { id: b.id, status: b.status, qr: null, age: b.qrAge };
            if (b.status === 'qr' && b.qr) {
                sim.qr = await QRCode.toDataURL(b.qr, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
            }
            simulators.push(sim);
        }
    } catch (e) {
        // Simulator API booting
    }

    res.json({ business: biz, simulators });
});

// ─── Add Bot API ─────────────────────────────────────────
app.post('/api/add-bot', async (req, res) => {
    try {
        const r = await fetch('http://localhost:3001/api/internal/add', { method: 'POST' });
        const d = await r.json();
        res.json(d);
    } catch(e) {
        res.status(500).json({ error: 'Manager not ready' });
    }
});

// ─── Dashboard HTML ───────────────────────────────────────
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WhatsApp Bot Hub (Multi-Bot)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--g:#25D366;--b:#34b7f1;--bg:#0b141a;--card:#1a2630;--text:#e9edef;--sub:#8696a0;--bdr:#2a3942}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:14px}
header{text-align:center;margin:10px 0 18px}
header h1{font-size:1.5rem;color:var(--g)}
header p{color:var(--sub);font-size:.78rem;margin-top:4px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:12px;width:100%;max-width:950px;margin-bottom:20px}
.card{background:var(--card);border-radius:14px;padding:16px;text-align:center;border:1px solid var(--bdr);border-bottom:3px solid transparent}
.card.biz{border-bottom-color:var(--g)}
.card.sim{border-bottom-color:var(--b)}

.card-title{font-size:.9rem;font-weight:700;margin-bottom:2px}
.desc{font-size:.72rem;color:var(--sub);margin-bottom:12px}

.qr-box{width:220px;height:220px;background:#fff;border-radius:12px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;position:relative;transition:transform .15s}
.qr-box:hover{transform:scale(1.02)}
.qr-box img{width:100%;height:100%;display:block}
.qr-box .msg{color:#444;font-size:.78rem;padding:14px;line-height:1.6;text-align:center}
.spin{width:28px;height:28px;border:3px solid #ddd;border-top-color:var(--g);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:.7rem;font-weight:700}
.badge.online{background:rgba(37,211,102,.12);color:var(--g)}
.badge.scan{background:rgba(241,196,15,.15);color:#f1c40f;animation:blink 1s step-start infinite}
@keyframes blink{50%{opacity:.5}}
.badge.boot{background:rgba(134,150,160,.12);color:var(--sub)}
.age{font-size:.65rem;color:var(--sub);margin-top:4px;min-height:14px}

.hint{margin-top:10px;background:#0d1f17;border:1px solid #1e3a25;border-radius:8px;padding:9px 12px;font-size:.7rem;color:#aabba7;line-height:1.65;text-align:left}

/* Add Bot Button */
.add-btn{background:transparent;border:2px dashed var(--bdr);color:var(--sub);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:bold;cursor:pointer;transition:all 0.2s;min-height:200px}
.add-btn:hover{border-color:var(--b);color:var(--b);background:rgba(52,183,241,0.05)}
.add-btn:active{transform:scale(0.98)}

/* Overlay */
#overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:999;flex-direction:column;align-items:center;justify-content:center}
#overlay.show{display:flex}
#overlay img{max-width:90vw;max-height:80vh;border-radius:12px}
#overlay button{margin-top:20px;background:var(--g);border:none;color:#fff;padding:8px 24px;border-radius:20px;cursor:pointer;font-size:.85rem}

.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--g);margin-right:4px;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
</style>
</head>
<body>

<div id="overlay">
  <img id="overlay-img" src="" alt="QR Full">
  <button onclick="closeOverlay()">✕ Close</button>
</div>

<header>
  <h1>📱 Multi-Bot Hub</h1>
  <p><span class="pulse"></span>Dynamic Cloud Scaling &nbsp;•&nbsp; QR refreshes every 3s</p>
</header>

<div class="grid" id="bots-grid">
  <!-- Loading state -->
  <div style="text-align:center;width:100%;grid-column:1/-1;margin-top:50px">Loading Bots...</div>
</div>

<script>
function openOverlay(src) {
    document.getElementById('overlay-img').src = src;
    document.getElementById('overlay').classList.add('show');
}
function closeOverlay() {
    document.getElementById('overlay').classList.remove('show');
}
document.getElementById('overlay').addEventListener('click', function(e){
    if(e.target===this) closeOverlay();
});

function createCardHTML(bot, isBiz) {
    const title = isBiz ? "💼 BUSINESS BOT" : "🤖 CUStOMER BOT " + bot.id;
    const color = isBiz ? "var(--g)" : "var(--b)";
    const cls = isBiz ? "biz" : "sim";
    const desc = isBiz ? "Scan with Business App" : "Scan with Testing/Customer App";
    
    let boxContent = '<div class="spin"></div>';
    let badgeHtml = '<div class="badge boot">Loading...</div>';
    let ageText = '';
    let clickAttr = '';

    if (bot.status === 'qr' && bot.qr) {
        let remaining = Math.max(0, 25 - bot.age);
        boxContent = '<img src="' + bot.qr + '" alt="QR"/>';
        badgeHtml = '<div class="badge scan">⬤ SCAN NOW — ' + remaining + 's</div>';
        ageText = 'Tap QR to enlarge';
        clickAttr = 'onclick="openOverlay(\\'' + bot.qr + '\\')"';
    } else if (bot.status === 'online') {
        boxContent = '<div class="msg">✅ Logged In &amp; Active!<br><br>Bot running 24/7.</div>';
        badgeHtml = '<div class="badge online">⬤ ONLINE</div>';
    }

    return \`
    <div class="card \${cls}">
      <div class="card-title" style="color:\${color}">\${title}</div>
      <div class="desc">\${desc}</div>
      <div class="qr-box" \${clickAttr}>\${boxContent}</div>
      \${badgeHtml}
      <div class="age">\${ageText}</div>
    </div>\`;
}

async function addBot() {
    const btn = document.getElementById('add-bot-btn');
    btn.innerHTML = '<div class="spin" style="width:20px;height:20px;margin-right:10px"></div> Adding...';
    btn.disabled = true;
    try {
        await fetch('/api/add-bot', { method: 'POST' });
        await fetchStatus();
    } catch(e) {
        alert('Failed to add bot. Manager might be booting.');
    }
}

async function fetchStatus() {
    try {
        const r = await fetch('/api/status?t=' + Date.now());
        const data = await r.json();
        
        const grid = document.getElementById('bots-grid');
        let html = createCardHTML(data.business, true);
        
        data.simulators.forEach(sim => {
            html += createCardHTML(sim, false);
        });

        // Add Bot Button (limit to 20 temporarily via UI)
        if (data.simulators.length < 20) {
            html += \`
            <button id="add-bot-btn" class="card add-btn" onclick="addBot()">
              ➕ Add Customer Bot
            </button>\`;
        }

        grid.innerHTML = html;
    } catch(e) {}
}

fetchStatus();
setInterval(fetchStatus, 3000);
</script>

</body>
</html>`);
});

app.listen(PORT, () => console.log('🌍 Bot Hub UI running on port ' + PORT));
