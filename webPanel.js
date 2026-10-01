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
    res.send(`<html><head><title>Setup</title><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet"></head><body style="background:#0b0b0e;color:#fff;font-family:'Rajdhani',sans-serif;text-align:center;padding:60px 20px;"><h1 style="color:#ff2a4b;text-shadow:0 0 10px rgba(255,42,75,0.5);">Bot API Configured</h1><p style="color:#888;margin:20px 0;">URL: <code>${config.botApiUrl}</code></p><a href="/login" style="display:inline-block;margin-top:30px;padding:14px 30px;background:linear-gradient(135deg,#ff2a4b,#b3001b);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;letter-spacing:2px;box-shadow:0 0 15px rgba(255,42,75,0.4);">GO TO LOGIN</a></body></html>`);
});

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');

:root {
    --bg: #050507;
    --panel-bg: rgba(17, 17, 22, 0.85);
    --neon-red: #ff2a4b;
    --neon-green: #00e676;
    --text-main: #ffffff;
    --text-muted: #888888;
    --border-color: rgba(255, 42, 75, 0.25);
}

*{margin:0;padding:0;box-sizing:border-box;font-family:'Rajdhani',sans-serif;}
body{background:var(--bg);color:var(--text-main);min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 20%,rgba(255,0,60,0.12),transparent 40%),radial-gradient(circle at 80% 80%,rgba(120,0,255,0.1),transparent 40%);pointer-events:none;z-index:0;}

/* === LOGIN PAGE === */
.voltra-bg{background:var(--bg);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;position:relative;overflow:hidden;}
.voltra-container{width:100%;max-width:420px;text-align:center;position:relative;z-index:2;}
.voltra-emblem{font-size:80px;margin-bottom:10px;filter:drop-shadow(0 0 30px rgba(255,42,75,0.8));animation:pulse-glow 2s infinite alternate;display:inline-block;}
@keyframes pulse-glow{from{filter:drop-shadow(0 0 15px rgba(255,42,75,0.4))}to{filter:drop-shadow(0 0 40px rgba(255,42,75,1))}}
.voltra-title{color:var(--neon-red);font-size:32px;font-weight:900;letter-spacing:6px;margin-bottom:12px;text-transform:uppercase;text-shadow:0 0 20px rgba(255,42,75,0.5);}
.voltra-tag{display:inline-block;background:rgba(255,42,75,0.1);border:1px solid rgba(255,42,75,0.3);color:var(--neon-red);font-size:10px;padding:8px 20px;border-radius:20px;letter-spacing:2px;margin-bottom:30px;font-weight:700;text-transform:uppercase;}
.voltra-info-card{background:var(--panel-bg);backdrop-filter:blur(10px);border:1px solid var(--border-color);border-radius:20px;padding:30px 24px;margin-bottom:24px;box-shadow:0 15px 40px rgba(0,0,0,0.8);position:relative;overflow:hidden;}
.voltra-info-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,transparent,var(--neon-red),transparent);}
.voltra-shield{font-size:32px;margin-bottom:12px;filter:drop-shadow(0 0 15px var(--neon-red));}
.voltra-info-card h3{color:#fff;font-size:14px;letter-spacing:4px;margin-bottom:12px;text-transform:uppercase;font-weight:800;}
.voltra-info-card p{color:var(--text-muted);font-size:12px;line-height:1.8;margin-bottom:20px;}
.voltra-form{display:flex;flex-direction:column;gap:14px;margin-bottom:16px;}
.voltra-form input{width:100%;padding:16px;background:rgba(0,0,0,0.6);border:1px solid #222;border-radius:12px;color:#fff;text-align:center;font-size:14px;transition:all .3s;}
.voltra-form input::placeholder{color:#555;letter-spacing:1px;}
.voltra-form input:focus{outline:none;border-color:var(--neon-red);box-shadow:0 0 20px rgba(255,42,75,0.2);background:#0d0d12;}
.voltra-btn-primary{width:100%;padding:18px;background:linear-gradient(135deg,var(--neon-red),#b3001b);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;letter-spacing:3px;cursor:pointer;text-transform:uppercase;box-shadow:0 10px 30px rgba(255,42,75,0.4);transition:all .3s;display:flex;justify-content:center;align-items:center;gap:10px;}
.voltra-btn-primary:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(255,42,75,0.6);}
.voltra-btn-outline{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;padding:16px;background:transparent;border:1px solid rgba(255,42,75,0.4);border-radius:12px;color:var(--neon-red);font-size:13px;font-weight:700;letter-spacing:2px;text-decoration:none;text-transform:uppercase;margin-bottom:12px;transition:all .3s;}
.voltra-btn-outline:hover{background:rgba(255,42,75,0.1);border-color:var(--neon-red);box-shadow:0 0 25px rgba(255,42,75,0.2);}
.voltra-footer-text{color:#444;font-size:11px;letter-spacing:4px;margin-top:30px;margin-bottom:16px;font-weight:700;text-transform:uppercase;}
.voltra-socials{display:flex;justify-content:center;gap:16px;}
.voltra-social-icon{width:48px;height:48px;border-radius:50%;background:#0d0d12;border:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:20px;text-decoration:none;transition:all .3s;color:#fff;}
.voltra-social-icon:hover{border-color:var(--neon-red);box-shadow:0 0 20px rgba(255,42,75,0.4);transform:translateY(-3px);}
.voltra-err{color:#ff3355;font-size:12px;margin-bottom:15px;font-weight:600;padding:10px;background:rgba(255,42,75,0.1);border-radius:8px;}

/* === DASHBOARD APP UI === */
.dashboard-bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;overflow:hidden;}
.dashboard-bg video{position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover;filter:blur(4px) brightness(0.2);}
.dashboard-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;background:linear-gradient(135deg,rgba(5,5,7,0.9) 0%,rgba(5,5,7,0.8) 50%,rgba(5,5,7,0.95) 100%);pointer-events:none;}
body.dashboard-body{background:transparent;padding-bottom:80px;}

/* Top Header */
.app-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:rgba(10,10,14,0.9);backdrop-filter:blur(15px);border-bottom:1px solid var(--border-color);position:sticky;top:0;z-index:100;}
.header-left{display:flex;align-items:center;gap:14px;}
.header-left h1{color:var(--neon-red);font-size:16px;letter-spacing:3px;font-weight:800;text-shadow:0 0 10px rgba(255,42,75,0.5);}
.menu-btn{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;transition:all .2s;}
.menu-btn:hover{color:var(--neon-red);text-shadow:0 0 10px var(--neon-red);}
.header-right{display:flex;align-items:center;gap:12px;}
.user-badge{display:flex;align-items:center;gap:8px;background:rgba(255,42,75,0.1);border:1px solid rgba(255,42,75,0.3);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;}
.badge-owner{color:var(--neon-red);text-shadow:0 0 5px var(--neon-red);}
.badge-user{color:var(--neon-green);text-shadow:0 0 5px var(--neon-green);}

/* Main Container */
.app-container{max-width:480px;margin:0 auto;padding:20px;position:relative;z-index:1;}

/* Welcome Card */
.welcome-card{background:var(--panel-bg);border:1px solid var(--border-color);border-radius:20px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.6);}
.welcome-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,transparent,var(--neon-red),transparent);}
.welcome-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
.welcome-info h3{color:var(--text-muted);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.welcome-info p{color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;}
.avatar-shield{width:50px;height:50px;background:linear-gradient(135deg,var(--neon-red),#b3001b);border-radius:14px;display:flex;justify-content:center;align-items:center;font-size:24px;box-shadow:0 0 20px rgba(255,42,75,0.5);}

/* Stats Grid */
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
.stat-box{background:rgba(0,0,0,0.4);border:1px solid #222;border-radius:14px;padding:16px 10px;text-align:center;transition:all .3s;}
.stat-box:hover{border-color:var(--border-color);box-shadow:0 0 15px rgba(255,42,75,0.1);}
.stat-icon{font-size:20px;margin-bottom:8px;filter:drop-shadow(0 0 8px var(--neon-red));}
.stat-val{color:#fff;font-size:16px;font-weight:800;font-family:'Share Tech Mono',monospace;margin-bottom:4px;}
.stat-label{color:var(--text-muted);font-size:10px;letter-spacing:1px;text-transform:uppercase;}

/* Section Title */
.section-title{display:flex;align-items:center;gap:10px;margin-bottom:16px;margin-top:24px;}
.section-title h2{color:#fff;font-size:14px;letter-spacing:2px;font-weight:800;text-transform:uppercase;}
.section-title::before{content:'';width:4px;height:18px;background:linear-gradient(180deg,var(--neon-red),#b3001b);border-radius:2px;box-shadow:0 0 10px var(--neon-red);}

/* Feature Card (Bug Execute) */
.feature-card{background:var(--panel-bg);border:1px solid var(--border-color);border-radius:20px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden;}
.feature-card::after{content:'';position:absolute;bottom:-50px;right:-50px;width:150px;height:150px;background:radial-gradient(circle,rgba(255,42,75,0.15),transparent 70%);pointer-events:none;}
.field{margin-bottom:16px;}
.field label{display:block;color:var(--text-muted);font-size:11px;letter-spacing:1.5px;margin-bottom:8px;text-transform:uppercase;font-weight:700;}
.field input,.field select{width:100%;padding:14px 16px;background:rgba(0,0,0,0.6);border:1px solid #222;border-radius:12px;color:#fff;font-size:14px;transition:all .3s;font-family:'Share Tech Mono',monospace;}
.field input:focus,.field select:focus{outline:none;border-color:var(--neon-red);box-shadow:0 0 20px rgba(255,42,75,0.2);}
.btn-exec{width:100%;padding:16px;background:linear-gradient(135deg,var(--neon-red),#b3001b);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;letter-spacing:3px;cursor:pointer;text-transform:uppercase;box-shadow:0 8px 25px rgba(255,42,75,0.4);transition:all .3s;display:flex;justify-content:center;align-items:center;gap:10px;}
.btn-exec:hover{transform:translateY(-2px);box-shadow:0 12px 35px rgba(255,42,75,0.6);}
.btn-exec:disabled{background:#222;box-shadow:none;cursor:not-allowed;transform:none;}
.result{margin-top:16px;padding:16px;background:rgba(0,0,0,0.5);border-left:4px solid var(--neon-red);border-radius:8px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--neon-green);white-space:pre-wrap;word-break:break-all;line-height:1.6;display:none;}

/* Server Status */
.status-card{background:var(--panel-bg);border:1px solid var(--border-color);border-radius:20px;padding:20px;margin-bottom:20px;}
.status-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.status-badge{padding:6px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px;background:rgba(255,42,75,0.2);color:var(--neon-red);border:1px solid rgba(255,42,75,0.4);}
.status-badge.online{background:rgba(0,230,118,0.2);color:var(--neon-green);border-color:rgba(0,230,118,0.4);}
.status-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.status-item{text-align:center;padding:10px 5px;background:rgba(0,0,0,0.3);border-radius:10px;border:1px solid #1a1a1a;}
.status-item .val{font-size:14px;font-weight:800;font-family:'Share Tech Mono',monospace;color:#fff;margin-bottom:4px;}
.status-item .lbl{font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;}

/* Local Time Widget */
.time-widget{background:var(--panel-bg);border:1px solid var(--border-color);border-radius:20px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;}
.time-left h3{color:var(--text-muted);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.time-left .clock{color:#fff;font-size:32px;font-weight:800;font-family:'Share Tech Mono',monospace;text-shadow:0 0 15px rgba(255,42,75,0.5);}
.time-right{text-align:right;}
.time-right .date{color:var(--neon-red);font-size:12px;font-weight:700;letter-spacing:1px;margin-bottom:4px;}
.time-right .day{color:var(--text-muted);font-size:11px;text-transform:uppercase;}

/* Bottom Navigation */
.bottom-nav{position:fixed;bottom:0;left:0;width:100%;background:rgba(10,10,14,0.95);backdrop-filter:blur(20px);border-top:1px solid var(--border-color);display:flex;justify-content:space-around;align-items:center;padding:10px 0 15px 0;z-index:1000;}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--text-muted);text-decoration:none;font-size:10px;font-weight:700;letter-spacing:1px;transition:all .3s;cursor:pointer;background:none;border:none;width:60px;}
.nav-item.active{color:var(--neon-red);text-shadow:0 0 10px rgba(255,42,75,0.5);}
.nav-item.active .nav-icon{filter:drop-shadow(0 0 10px var(--neon-red));}
.nav-icon{font-size:20px;margin-bottom:2px;transition:all .3s;}
.nav-fab{width:56px;height:56px;background:linear-gradient(135deg,var(--neon-red),#b3001b);border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:24px;color:#fff;box-shadow:0 0 20px rgba(255,42,75,0.6);transform:translateY(-20px);border:4px solid var(--bg);cursor:pointer;transition:all .3s;}
.nav-fab:hover{transform:translateY(-25px) scale(1.05);box-shadow:0 0 30px rgba(255,42,75,0.8);}

/* Sidebar */
.sidebar{position:fixed;top:0;left:-340px;width:320px;height:100vh;background:rgba(10,10,14,0.98);backdrop-filter:blur(20px);border-right:1px solid var(--border-color);z-index:2000;transition:left .3s ease;overflow-y:auto;padding:24px 20px;}
.sidebar.open{left:0;}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1999;opacity:0;pointer-events:none;transition:opacity .3s;}
.sidebar-overlay.open{opacity:1;pointer-events:auto;}
.sidebar h2{color:var(--neon-red);font-size:13px;letter-spacing:2px;margin-bottom:20px;display:flex;align-items:center;gap:8px;text-transform:uppercase;}
.sidebar h2::before{content:'';width:3px;height:16px;background:linear-gradient(180deg,var(--neon-red),#b3001b);border-radius:2px;box-shadow:0 0 10px var(--neon-red);}
.close-btn{position:absolute;top:18px;right:18px;background:transparent;border:none;color:#666;font-size:24px;cursor:pointer;padding:4px 10px;border-radius:6px;}
.close-btn:hover{color:var(--neon-red);background:rgba(255,42,75,0.1);}
.current-session{background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.3);border-radius:12px;padding:14px;margin-bottom:16px;}
.current-session .label{color:var(--neon-green);font-size:10px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;margin-bottom:6px;}
.current-session .value{color:#fff;font-family:'Share Tech Mono',monospace;font-size:12px;word-break:break-all;}
.sessions-list{display:flex;flex-direction:column;gap:8px;}
.session-item{padding:12px 14px;background:rgba(0,0,0,0.3);border:1px solid #222;border-radius:10px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.session-item:hover{border-color:var(--border-color);background:rgba(255,42,75,0.05);}
.session-item.active{border-color:var(--neon-green);background:rgba(0,230,118,0.1);box-shadow:0 0 0 2px rgba(0,230,118,0.15);}
.session-item .id{font-family:'Share Tech Mono',monospace;font-size:11px;color:#ccc;word-break:break-all;flex:1;}
.session-item .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.dot-on{background:var(--neon-green);box-shadow:0 0 8px var(--neon-green);}
.dot-off{background:#444;}
.session-item .name{font-size:11px;color:#888;margin-top:3px;}
.refresh-btn{width:100%;padding:10px;margin-top:16px;background:rgba(255,255,255,0.05);border:1px solid #222;border-radius:8px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;}
.refresh-btn:hover{border-color:var(--neon-red);}

/* Admin Card */
.admin-card{background:var(--panel-bg);border:1px solid var(--border-color);border-radius:20px;padding:24px;margin-bottom:20px;}
.btn-green{width:100%;padding:16px;background:linear-gradient(135deg,var(--neon-green),#009624);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 8px 25px rgba(0,230,118,0.4);transition:all .3s;margin-top:16px;}
.btn-green:hover{transform:translateY(-2px);box-shadow:0 12px 35px rgba(0,230,118,0.6);}

/* Loader */
.loader{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle;}
@keyframes spin{to{transform:rotate(360deg)}}

/* Views */
.view-section{display:none;}
.view-section.active{display:block;animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
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

<div class="voltra-footer-text" style="margin-top:20px;font-size:10px;">OWNER @UnknownGuy9876 • @SGCodexs</div>
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
<!-- SIDEBAR (OWNER ONLY) -->
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

<!-- HEADER -->
<div class="app-header">
<div class="header-left">
${isOwner ? '<button class="menu-btn" onclick="openSidebar()">☰</button>' : ''}
<h1>💀 DORA CRASHER</h1>
</div>
<div class="header-right">
<div class="user-badge">
${req.session.user.username}
<span class="${isOwner ? 'badge-owner' : 'badge-user'}">${isOwner ? 'OWNER' : 'USER'}</span>
</div>
<a href="/logout" style="color:var(--neon-red);text-decoration:none;font-size:18px;font-weight:bold;">⏻</a>
</div>
</div>

<!-- MAIN CONTAINER -->
<div class="app-container">

<!-- VIEW: HOME -->
<div id="view-home" class="view-section active">
<div class="welcome-card">
<div class="welcome-top">
<div class="welcome-info">
<h3>Welcome Back,</h3>
<p>${req.session.user.username}</p>
</div>
<div class="avatar-shield">🛡️</div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;">
<span style="font-size:10px;background:rgba(255,42,75,0.1);border:1px solid rgba(255,42,75,0.3);padding:4px 10px;border-radius:10px;color:var(--neon-red);font-weight:700;letter-spacing:1px;">VOLTRA-X DASHBOARD</span>
<span style="font-size:10px;color:var(--text-muted);">2026-09-22</span>
</div>
</div>

<div class="stats-grid">
<div class="stat-box">
<div class="stat-icon">👥</div>
<div class="stat-val" id="statOnline">0</div>
<div class="stat-label">Online Users</div>
</div>
<div class="stat-box">
<div class="stat-icon">🔗</div>
<div class="stat-val" id="statConn">0</div>
<div class="stat-label">Connections</div>
</div>
<div class="stat-box">
<div class="stat-icon">📅</div>
<div class="stat-val" id="statExp">--</div>
<div class="stat-label">Expiration</div>
</div>
</div>

<div class="time-widget">
<div class="time-left">
<h3>Waktu Lokal</h3>
<div class="clock" id="clock">00:00:00</div>
</div>
<div class="time-right">
<div class="date" id="date">--/--/----</div>
<div class="day" id="day">---</div>
</div>
</div>

<div class="section-title"><h2>Fitur Utama</h2></div>
<div class="feature-card">
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
<button class="btn-exec" id="execBtn" onclick="execute()">⚡ EXECUTE BUG</button>
<div id="result" class="result"></div>
</div>

<div class="section-title"><h2>Server Status</h2></div>
<div class="status-card">
<div class="status-header">
<span style="font-size:12px;font-weight:700;color:#fff;letter-spacing:1px;">REALTIME • LIVE MONITORING</span>
<span class="status-badge" id="serverStatusBadge">OFFLINE</span>
</div>
<div class="status-grid">
<div class="status-item"><div class="val" id="sOnline">0</div><div class="lbl">Online</div></div>
<div class="status-item"><div class="val" id="sConn">0</div><div class="lbl">Conn</div></div>
<div class="status-item"><div class="val" id="sBugs">10</div><div class="lbl">Bugs</div></div>
<div class="status-item"><div class="val" id="sBat">64</div><div class="lbl">Bat</div></div>
</div>
</div>
</div>

<!-- VIEW: INFO -->
<div id="view-info" class="view-section">
<div class="section-title"><h2>System Info</h2></div>
<div class="feature-card">
<p style="color:var(--text-muted);font-size:13px;line-height:1.8;">Device: Web Panel<br>Network: Online<br>Status: Active<br>Role: ${req.session.user.role.toUpperCase()}</p>
</div>
</div>

<!-- VIEW: TOOLS (OWNER ONLY) -->
<div id="view-tools" class="view-section">
${isOwner ? `
<div class="section-title"><h2>Owner Control</h2></div>
<div class="admin-card">
<div class="field"><label>Username</label><input type="text" id="newUser" placeholder="New username"></div>
<div class="field"><label>Password</label><input type="password" id="newPass" placeholder="New password"></div>
<div class="field"><label>Role</label><select id="newRole"><option value="user">User</option><option value="owner">Owner</option></select></div>
<button class="btn-green" onclick="addUser()">ADD USER</button>
<div id="adminResult" class="result" style="color:var(--neon-green);border-left-color:var(--neon-green);"></div>
</div>
` : '<div class="feature-card"><p style="color:var(--text-muted);text-align:center;">Access Denied</p></div>'}
</div>

<!-- VIEW: THEME -->
<div id="view-theme" class="view-section">
<div class="section-title"><h2>Theme</h2></div>
<div class="feature-card">
<p style="color:var(--text-muted);text-align:center;">Dark Cyberpunk Theme Active</p>
</div>
</div>

</div>

<!-- BOTTOM NAVIGATION -->
<div class="bottom-nav">
<button class="nav-item active" onclick="switchView('home', this)">
<span class="nav-icon">🏠</span>HOME
</button>
<button class="nav-item" onclick="switchView('info', this)">
<span class="nav-icon">ℹ️</span>INFO
</button>
<div class="nav-fab" onclick="switchView('home', this); document.getElementById('target').focus();">🐛</div>
<button class="nav-item" onclick="switchView('tools', this)">
<span class="nav-icon">🔧</span>TOOLS
</button>
<button class="nav-item" onclick="switchView('theme', this)">
<span class="nav-icon">🔥</span>THEME
</button>
</div>

<script>
var allSessions = [];
var currentSessionId = null;

// CLOCK
function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = h + ':' + m + ':' + s;
    
    var d = String(now.getDate()).padStart(2, '0');
    var mo = String(now.getMonth() + 1).padStart(2, '0');
    var y = now.getFullYear();
    document.getElementById('date').textContent = d + '/' + mo + '/' + y;
    
    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    document.getElementById('day').textContent = days[now.getDay()];
}
setInterval(updateClock, 1000);
updateClock();

// VIEW SWITCHER
function switchView(viewId, btn) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(btn && btn.classList.contains('nav-item')) {
        btn.classList.add('active');
    } else {
        // If FAB is clicked, highlight Home
        document.querySelector('.nav-item').classList.add('active');
    }
}

function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}

async function loadSessions(){
    var list=document.getElementById('sessionsList');
    list.innerHTML='<div style="text-align:center;padding:20px;color:#555;font-size:12px;"><span class="loader"></span> Loading...</div>';
    try{
        var res=await fetch('/api/sessions');
        var d=await res.json();
        if(!d.success){list.innerHTML='<div class="result" style="display:block;color:#ff3355;">'+d.message+'</div>';return;}
        allSessions=d.sessions||[];
        currentSessionId=d.current||null;
        renderSessions();
        updateCurrent();
        
        // Update dashboard stats
        document.getElementById('statOnline').textContent = d.onlineUsers || 0;
        document.getElementById('statConn').textContent = d.activeConnections || 0;
        document.getElementById('sOnline').textContent = d.onlineUsers || 0;
        document.getElementById('sConn').textContent = d.activeConnections || 0;
        document.getElementById('serverStatusBadge').textContent = 'ONLINE';
        document.getElementById('serverStatusBadge').classList.add('online');
    }catch(e){list.innerHTML='<div class="result" style="display:block;color:#ff3355;">Error: '+e.message+'</div>';}
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
    if(currentSessionId){el.textContent=currentSessionId;el.style.color='var(--neon-green)';}
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
        r.style.color=d.success?'var(--neon-green)':'#ff3355';r.textContent=d.message;
    }catch(e){r.style.color='#ff3355';r.textContent='Error: '+e.message}
    b.disabled=false;b.innerHTML='⚡ EXECUTE BUG';
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
        o.style.display='block';o.style.color=d.success?'var(--neon-green)':'#ff3355';o.textContent=d.message;
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

app.listen(PORT, () => console.log("DORA CRASHER WEB PANEL ON PORT " + PORT));
