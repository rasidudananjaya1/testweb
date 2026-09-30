const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const CONFIG_FILE = path.join(__dirname, "webConfig.json");
const USERS_FILE = path.join(__dirname, "webusers.json");

// Video URL - oyata one nam wenas karanna
const BG_VIDEO_URL = "https://files.catbox.moe/baqsck.mp4";

let config = { botApiUrl: "", botApiKey: "" };

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try { config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")); } catch (e) {}
    }
    if (process.env.BOT_API_URL) config.botApiUrl = process.env.BOT_API_URL.replace(/\/$/, "");
    if (process.env.BOT_API_KEY) config.botApiKey = process.env.BOT_API_KEY;
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

loadConfig();

if (!fs.existsSync(USERS_FILE)) {
    const hash = bcrypt.hashSync("admin123", 10);
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ username: "admin", password: hash, role: "owner" }], null, 2));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || "dora-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/login");
}

function requireOwner(req, res, next) {
    if (req.session.user && req.session.user.role === "owner") return next();
    res.status(403).json({ success: false, message: "Access denied" });
}

app.get("/setup", (req, res) => {
    const { url, key } = req.query;
    if (!url || !key) return res.send("<h2>Missing URL or KEY</h2>");
    config.botApiUrl = url.replace(/\/$/, "");
    config.botApiKey = key;
    saveConfig();
    res.send(`<html><head><title>Setup</title></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:60px 20px;"><h1 style="color:#00e676;">Bot API Configured</h1><p style="color:#888;margin:20px 0;">URL: <code>${config.botApiUrl}</code></p><a href="/login" style="display:inline-block;margin-top:30px;padding:14px 30px;background:#ff0033;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">GO TO LOGIN</a></body></html>`);
});

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter','Segoe UI',sans-serif}
body{background:#050507;color:#fff;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 20%,rgba(255,0,60,0.12),transparent 40%),radial-gradient(circle at 80% 80%,rgba(120,0,255,0.1),transparent 40%);pointer-events:none;z-index:0}
.center{display:flex;align-items:center;justify-content:center;min-height:100vh;position:relative;z-index:1}
.box{background:rgba(17,17,22,0.85);backdrop-filter:blur(20px);padding:48px 40px;border-radius:20px;border:1px solid rgba(255,0,60,0.25);width:92%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.6)}
.logo{text-align:center;margin-bottom:32px}
.logo-icon{font-size:42px;display:block;margin-bottom:12px;filter:drop-shadow(0 0 20px rgba(255,0,60,0.5))}
.logo h1{color:#ff0033;font-size:20px;letter-spacing:4px;font-weight:800}
.logo p{color:#555;font-size:11px;letter-spacing:3px;margin-top:6px}
label{display:block;color:#888;font-size:11px;margin-bottom:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600}
input,select{width:100%;padding:14px 16px;background:rgba(20,20,25,0.9);border:1px solid #222;border-radius:10px;color:#fff;font-size:14px}
input:focus,select:focus{outline:none;border-color:#ff0033;box-shadow:0 0 0 3px rgba(255,0,60,0.15)}
.btn{width:100%;padding:15px;margin-top:22px;background:linear-gradient(135deg,#ff0033,#cc0029);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:2px}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,0,60,0.4)}
.btn:disabled{background:#222;cursor:not-allowed}
.btn-green{background:linear-gradient(135deg,#00c853,#009624)}
.err{color:#ff3355;text-align:center;margin-top:14px;font-size:13px;padding:10px;background:rgba(255,0,60,0.08);border-radius:8px}
.tag{text-align:center;color:#333;font-size:10px;margin-top:24px;letter-spacing:2px}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:rgba(17,17,22,0.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,0,60,0.2);position:sticky;top:0;z-index:100}
.header-left{display:flex;align-items:center;gap:14px}
.header h1{color:#ff0033;font-size:15px;letter-spacing:3px;font-weight:800}
.menu-btn{background:rgba(255,255,255,0.05);border:1px solid #222;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:16px;line-height:1;transition:all .2s}
.menu-btn:hover{border-color:#ff0033;background:rgba(255,0,60,0.1)}
.header .user{display:flex;align-items:center;gap:12px;font-size:12px;color:#888}
.badge{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.5px}
.badge-owner{background:linear-gradient(135deg,#ff0033,#cc0029);color:#fff}
.badge-user{background:#222;color:#888}
.logout{color:#ff0033;text-decoration:none;font-size:11px;letter-spacing:1.5px;font-weight:600}
.sidebar{position:fixed;top:0;left:-340px;width:320px;height:100vh;background:rgba(10,10,14,0.98);backdrop-filter:blur(20px);border-right:1px solid rgba(255,0,60,0.25);z-index:200;transition:left .3s ease;overflow-y:auto;padding:24px 20px}
.sidebar.open{left:0}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;opacity:0;pointer-events:none;transition:opacity .3s}
.sidebar-overlay.open{opacity:1;pointer-events:auto}
.sidebar h2{color:#ff0033;font-size:13px;letter-spacing:2px;margin-bottom:20px;display:flex;align-items:center;gap:8px}
.sidebar h2::before{content:'';width:3px;height:16px;background:linear-gradient(180deg,#ff0033,#cc0029);border-radius:2px}
.close-btn{position:absolute;top:18px;right:18px;background:transparent;border:none;color:#666;font-size:20px;cursor:pointer;padding:4px 10px;border-radius:6px}
.close-btn:hover{color:#ff0033;background:rgba(255,0,60,0.1)}
.current-session{background:rgba(0,200,83,0.08);border:1px solid rgba(0,200,83,0.3);border-radius:10px;padding:14px;margin-bottom:16px}
.current-session .label{color:#00e676;font-size:10px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;margin-bottom:6px}
.current-session .value{color:#fff;font-family:monospace;font-size:12px;word-break:break-all}
.sessions-list{display:flex;flex-direction:column;gap:8px}
.session-item{padding:12px 14px;background:rgba(0,0,0,0.3);border:1px solid #222;border-radius:10px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between;gap:8px}
.session-item:hover{border-color:rgba(255,0,60,0.3);background:rgba(255,0,60,0.05)}
.session-item.active{border-color:#00e676;background:rgba(0,200,83,0.1);box-shadow:0 0 0 2px rgba(0,200,83,0.15)}
.session-item .id{font-family:monospace;font-size:11px;color:#ccc;word-break:break-all;flex:1}
.session-item .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-on{background:#00e676;box-shadow:0 0 8px #00e676}
.dot-off{background:#444}
.session-item .name{font-size:11px;color:#888;margin-top:3px}
.refresh-btn{width:100%;padding:10px;margin-top:16px;background:rgba(255,255,255,0.05);border:1px solid #222;border-radius:8px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase}
.refresh-btn:hover{border-color:#ff0033}
.container{max-width:720px;margin:0 auto;padding:32px 20px;position:relative;z-index:1}
.card{background:rgba(17,17,22,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:28px;margin-bottom:20px}
.card h2{color:#fff;font-size:13px;letter-spacing:2px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px;text-transform:uppercase}
.card h2::before{content:'';width:3px;height:16px;background:linear-gradient(180deg,#ff0033,#cc0029);border-radius:2px}
.field{margin-bottom:18px}
.result{margin-top:18px;padding:16px;background:rgba(0,0,0,0.4);border-left:3px solid #ff0033;border-radius:8px;font-family:monospace;font-size:12px;color:#00e676;white-space:pre-wrap;word-break:break-all;line-height:1.6}
.loader{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}

/* === VOLTRA-X LOGIN STYLE === */
.voltra-bg{background:#050507;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;position:relative;overflow:hidden}
.voltra-bg::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 20%,rgba(255,0,60,0.15),transparent 40%),radial-gradient(circle at 80% 80%,rgba(120,0,255,0.12),transparent 40%);pointer-events:none;z-index:0}
.voltra-container{width:100%;max-width:420px;text-align:center;position:relative;z-index:2}
.voltra-emblem{font-size:90px;margin-bottom:10px;filter:drop-shadow(0 0 30px rgba(255,0,60,0.8));animation:pulse-glow 2s infinite alternate;display:inline-block}
@keyframes pulse-glow{from{filter:drop-shadow(0 0 15px rgba(255,0,60,0.4))}to{filter:drop-shadow(0 0 40px rgba(255,0,60,1))}}
.voltra-title{color:#ff0033;font-size:34px;font-weight:900;letter-spacing:6px;margin-bottom:12px;text-transform:uppercase;text-shadow:0 0 20px rgba(255,0,60,0.5)}
.voltra-tag{display:inline-block;background:rgba(255,0,51,0.1);border:1px solid rgba(255,0,51,0.3);color:#ff0033;font-size:10px;padding:8px 20px;border-radius:20px;letter-spacing:2px;margin-bottom:30px;font-weight:700;text-transform:uppercase}
.voltra-info-card{background:rgba(13,13,18,0.85);backdrop-filter:blur(10px);border:1px solid rgba(255,0,51,0.2);border-radius:20px;padding:30px 24px;margin-bottom:24px;box-shadow:0 15px 40px rgba(0,0,0,0.8);position:relative;overflow:hidden}
.voltra-info-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,transparent,#ff0033,transparent)}
.voltra-shield{font-size:32px;margin-bottom:12px;filter:drop-shadow(0 0 15px #ff0033)}
.voltra-info-card h3{color:#fff;font-size:14px;letter-spacing:4px;margin-bottom:12px;text-transform:uppercase;font-weight:800}
.voltra-info-card p{color:#888;font-size:12px;line-height:1.8;margin-bottom:20px}
.voltra-form{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}
.voltra-form input{width:100%;padding:16px;background:rgba(0,0,0,0.6);border:1px solid #222;border-radius:12px;color:#fff;text-align:center;font-size:14px;transition:all .3s}
.voltra-form input::placeholder{color:#555;letter-spacing:1px}
.voltra-form input:focus{outline:none;border-color:#ff0033;box-shadow:0 0 20px rgba(255,0,51,0.2);background:#0d0d12}
.voltra-btn-primary{width:100%;padding:18px;background:linear-gradient(135deg,#ff0033,#cc0029);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;letter-spacing:3px;cursor:pointer;text-transform:uppercase;box-shadow:0 10px 30px rgba(255,0,51,0.4);transition:all .3s;display:flex;justify-content:center;align-items:center;gap:10px}
.voltra-btn-primary:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(255,0,51,0.6)}
.voltra-btn-outline{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;padding:16px;background:transparent;border:1px solid rgba(255,0,51,0.4);border-radius:12px;color:#ff0033;font-size:13px;font-weight:700;letter-spacing:2px;text-decoration:none;text-transform:uppercase;margin-bottom:12px;transition:all .3s;box-sizing:border-box}
.voltra-btn-outline:hover{background:rgba(255,0,51,0.1);border-color:#ff0033;box-shadow:0 0 25px rgba(255,0,51,0.2)}
.voltra-footer-text{color:#444;font-size:11px;letter-spacing:4px;margin-top:30px;margin-bottom:16px;font-weight:700;text-transform:uppercase}
.voltra-socials{display:flex;justify-content:center;gap:16px}
.voltra-social-icon{width:48px;height:48px;border-radius:50%;background:#0d0d12;border:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:20px;text-decoration:none;transition:all .3s;color:#fff}
.voltra-social-icon:hover{border-color:#ff0033;box-shadow:0 0 20px rgba(255,0,51,0.4);transform:translateY(-3px)}
.voltra-err{color:#ff3355;font-size:12px;margin-bottom:15px;font-weight:600;padding:10px;background:rgba(255,0,60,0.1);border-radius:8px}

/* === DASHBOARD VIDEO BACKGROUND === */
.dashboard-bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;overflow:hidden}
.dashboard-bg video{position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover;filter:blur(2px) brightness(0.35)}
.dashboard-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;background:linear-gradient(135deg,rgba(5,5,7,0.85) 0%,rgba(5,5,7,0.7) 50%,rgba(5,5,7,0.9) 100%);pointer-events:none}
body.dashboard-body{background:transparent}

@media(max-width:520px){.header h1{font-size:12px}.card{padding:20px}.voltra-title{font-size:26px;letter-spacing:4px}}
`;

function loginPage(err) {
    return `<!DOCTYPE html><html><head><title>DORA CRASHER</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
<div class="voltra-bg">
<div class="voltra-container">
<div class="voltra-emblem">🕷️</div>
<h1 class="voltra-title">DORA CRASHER</h1>
<div class="voltra-tag">FAST • UPDATE • STABLE</div>

<div class="voltra-info-card">
<div class="voltra-shield">🛡️</div>
<h3>INFORMATION</h3>
<p>Premium bug bot engine. Enter your credentials to access the system.</p>

${err ? '<div class="voltra-err">❌ Invalid username or password</div>' : ''}

<form method="POST" action="/login" class="voltra-form">
<input type="text" name="username" placeholder="Enter Username" required autofocus>
<input type="password" name="password" placeholder="Enter Password" required>
<button type="submit" class="voltra-btn-primary">🚀 LOGIN TO ENGINE</button>
</form>
</div>

<a href="https://t.me/x_dora_id_error_0" target="_blank" class="voltra-btn-outline">🛒 BUY ACCESS</a>
<a href="https://t.me/x_dora_id_error_0" target="_blank" class="voltra-btn-outline">🎧 CONTACT DEVELOPER</a>

<div class="voltra-footer-text">HUBUNGI KAMI</div>
<div class="voltra-socials">
<a href="https://t.me/crasher_dora" target="_blank" class="voltra-social-icon">✈️</a>
<a href="https://t.me/x_dora_id_error_0" target="_blank" class="voltra-social-icon">✈️</a>
<a href="https://wa.me/94763007898" target="_blank" class="voltra-social-icon">💬</a>
</div>

<div class="tag">OWNER @UnknownGuy9876 • @SGCodexs</div>
</div>
</div>
</body></html>`;
}

app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.send(loginPage(req.query.err)));

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.redirect("/login?err=1");
    req.session.user = { username: user.username, role: user.role };
    res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/dashboard", requireLogin, (req, res) => {
    const isOwner = req.session.user.role === "owner";
    res.send(`<!DOCTYPE html><html><head><title>DORA CRASHER</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body class="dashboard-body">

<div class="dashboard-bg">
<video autoplay muted loop playsinline>
<source src="${BG_VIDEO_URL}" type="video/mp4">
</video>
</div>
<div class="dashboard-overlay"></div>

${isOwner ? `
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
<div class="sidebar" id="sidebar">
<button class="close-btn" onclick="closeSidebar()">×</button>
<h2>SESSIONS</h2>
<div class="current-session" id="currentSession">
<div class="label">Active Session</div>
<div class="value" id="currentSessionValue">Loading...</div>
</div>
<div class="sessions-list" id="sessionsList">
<div style="text-align:center;padding:20px;color:#555;font-size:12px;"><span class="loader"></span> Loading...</div>
</div>
<button class="refresh-btn" onclick="loadSessions()">REFRESH</button>
</div>
` : ''}

<div class="header">
<div class="header-left">
${isOwner ? '<button class="menu-btn" onclick="openSidebar()">☰</button>' : ''}
<h1>💀 DORA CRASHER</h1>
</div>
<div class="user">
${req.session.user.username}
<span class="badge ${isOwner ? 'badge-owner' : 'badge-user'}">${isOwner ? 'OWNER' : 'USER'}</span>
<a href="/logout" class="logout">LOGOUT</a>
</div>
</div>

<div class="container">
<div class="card">
<h2>Execute Bug</h2>
<div class="field">
<label>Target Number</label>
<input type="text" id="target" placeholder="947xxxxxxxx" autocomplete="off">
</div>
<div class="field">
<label>Bug Command</label>
<select id="command">
<option value="IOSCRASH">IOSCRASH - iOS Force Close</option>
<option value="DORAIOS">DORAIOS - Infinite iOS Stuck</option>
<option value="frezewa">frezewa - Android Freeze</option>
<option value="fcbeta">fcbeta - Android Delay Beta</option>
<option value="andro">andro - Android Spam</option>
<option value="DelayHard">DelayHard - Close X Freeze</option>
<option value="buldozer">buldozer - Android Buldozer</option>
<option value="hima">hima - Fcinvisible</option>
<option value="DoraFc">DoraFc - Force Close WP</option>
</select>
</div>
<button class="btn" id="execBtn" onclick="execute()">EXECUTE BUG</button>
<div id="result" class="result" style="display:none;"></div>
</div>

${isOwner ? `
<div class="card">
<h2>Owner Control</h2>
<div class="field"><label>Username</label><input type="text" id="newUser" placeholder="New username"></div>
<div class="field"><label>Password</label><input type="password" id="newPass" placeholder="New password"></div>
<div class="field"><label>Role</label><select id="newRole"><option value="user">User</option><option value="owner">Owner</option></select></div>
<button class="btn btn-green" onclick="addUser()">ADD USER</button>
<div id="adminResult" class="result" style="display:none;"></div>
</div>
` : ''}
</div>

<script>
var allSessions = [];
var currentSessionId = null;

function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}

async function loadSessions(){
var list=document.getElementById('sessionsList');
list.innerHTML='<div style="text-align:center;padding:20px;color:#555;font-size:12px;"><span class="loader"></span> Loading...</div>';
try{
var res=await fetch('/api/sessions');
var d=await res.json();
if(!d.success){list.innerHTML='<div class="err">'+d.message+'</div>';return;}
allSessions=d.sessions||[];
currentSessionId=d.current||null;
renderSessions();
updateCurrent();
}catch(e){list.innerHTML='<div class="err">Error: '+e.message+'</div>';}
}

function renderSessions(){
var list=document.getElementById('sessionsList');
if(!allSessions.length){list.innerHTML='<div style="text-align:center;padding:20px;color:#555;font-size:12px;">No sessions found</div>';return;}
var h='';
allSessions.forEach(function(s){
var on=s.status==='open';
var active=s.id===currentSessionId;
h+='<div class="session-item '+(active?'active':'')+'" onclick="selectSession(\\''+s.id+'\\')">';
h+='<div style="flex:1;"><div class="id">'+s.id+'</div>'+(s.name?'<div class="name">'+s.name+'</div>':'')+'</div>';
h+='<div class="dot '+(on?'dot-on':'dot-off')+'"></div>';
h+='</div>';
});
list.innerHTML=h;
}

function updateCurrent(){
var el=document.getElementById('currentSessionValue');
if(currentSessionId){el.textContent=currentSessionId;el.style.color='#00e676';}
else{el.textContent='No session selected';el.style.color='#666';}
}

async function selectSession(id){
try{
var res=await fetch('/api/select-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:id})});
var d=await res.json();
if(d.success){currentSessionId=id;renderSessions();updateCurrent();}
}catch(e){}
}

async function execute(){
var t=document.getElementById('target').value.trim();
var c=document.getElementById('command').value;
var b=document.getElementById('execBtn');
var r=document.getElementById('result');
if(!t){r.style.display='block';r.style.color='#ff3355';r.textContent='Enter target number';return}
b.disabled=true;b.innerHTML='<span class="loader"></span>EXECUTING';
r.style.display='block';r.style.color='#ffaa00';r.textContent='Sending...';
try{
var res=await fetch('/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:t,command:c})});
var d=await res.json();
r.style.color=d.success?'#00e676':'#ff3355';r.textContent=d.message;
}catch(e){r.style.color='#ff3355';r.textContent='Error: '+e.message}
b.disabled=false;b.textContent='EXECUTE BUG';
}

async function addUser(){
var u=document.getElementById('newUser').value.trim();
var p=document.getElementById('newPass').value.trim();
var ro=document.getElementById('newRole').value;
var o=document.getElementById('adminResult');
if(!u||!p){o.style.display='block';o.style.color='#ff3355';o.textContent='Fill all fields';return}
try{
var res=await fetch('/admin/adduser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,role:ro})});
var d=await res.json();
o.style.display='block';o.style.color=d.success?'#00e676':'#ff3355';o.textContent=d.message;
}catch(e){o.style.display='block';o.style.color='#ff3355';o.textContent='Error: '+e.message}
}

${isOwner ? 'loadSessions(); setInterval(loadSessions, 10000);' : ''}
</script>
</body></html>`);
});

app.post("/execute", requireLogin, async (req, res) => {
    const { target, command } = req.body;
    if (!target || !command) return res.json({ success: false, message: "Missing target or command" });
    const cleanTarget = target.replace(/[^0-9]/g, "");
    if (cleanTarget.length < 10) return res.json({ success: false, message: "Invalid number" });
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Bot API not configured" });

    try {
        await axios.post(config.botApiUrl + "/api/execute",
            { target: cleanTarget, command, user: req.session.user.username },
            { headers: { "x-api-key": config.botApiKey, "Content-Type": "application/json" }, timeout: 15000 }
        );
        res.json({ success: true, message: "Job sent\nTarget: " + cleanTarget + "\nCommand: /" + command });
    } catch (e) {
        const m = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        res.json({ success: false, message: "Bot server error: " + m });
    }
});

app.get("/api/sessions", requireLogin, requireOwner, async (req, res) => {
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Bot API not configured" });
    try {
        const r = await axios.get(config.botApiUrl + "/api/sessions", {
            headers: { "x-api-key": config.botApiKey }, timeout: 10000
        });
        res.json(r.data);
    } catch (e) {
        const m = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        res.json({ success: false, message: "Bot server error: " + m });
    }
});

app.post("/api/select-session", requireLogin, requireOwner, async (req, res) => {
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Bot API not configured" });
    try {
        const r = await axios.post(config.botApiUrl + "/api/select-session",
            { session: req.body.session },
            { headers: { "x-api-key": config.botApiKey, "Content-Type": "application/json" }, timeout: 10000 }
        );
        res.json(r.data);
    } catch (e) {
        const m = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        res.json({ success: false, message: "Bot server error: " + m });
    }
});

app.post("/admin/adduser", requireOwner, (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.json({ success: false, message: "Fill all fields" });
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (users.find(u => u.username === username)) return res.json({ success: false, message: "Username exists" });
    const hash = bcrypt.hashSync(password, 10);
    users.push({ username, password: hash, role: role || "user" });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ success: true, message: "User " + username + " added as " + (role || "user") });
});

app.listen(PORT, () => console.log("WEB PANEL ON PORT " + PORT));
