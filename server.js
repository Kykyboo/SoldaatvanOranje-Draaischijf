const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuratie
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1538600876523004004';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'pYsfza90eR_nFT0zCL3L9leGTpXLdLQG';
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://192.168.2.29:3000/auth/discord/callback';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1470855740993306808';
const REQUIRED_ROLE_ID = process.env.DISCORD_ROLE_ID || '1545347819999858742';

let latestCommand = { action: "none", data: {} };

// Roblox haalt hier de commando's op
app.get('/command', (req, res) => {
    res.json(latestCommand);
});

// Website stuurt hier commando's naartoe (aangepast naar /command-action zoals in jouw server script)
app.post('/command-action', (req, res) => {
    latestCommand = req.body;
    console.log("📥 [Server] Nieuw commando ontvangen:", latestCommand);
    res.json({ success: true, command: latestCommand });
});

// Discord Login Routes
app.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read`;
    res.redirect(discordAuthUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/login.html?error=unauthorized');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;
        const memberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (memberResponse.data.roles.includes(REQUIRED_ROLE_ID)) {
            res.send(`<script>localStorage.setItem('isLoggedIn', 'true'); window.location.href = '/';</script>`);
        } else {
            res.redirect('/login.html?error=unauthorized');
        }
    } catch (err) {
        console.error('❌ [Server] Discord Auth Fout:', err.response?.data || err.message);
        res.redirect('/login.html?error=unauthorized');
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 [Node.js] Server draait succesvol op http://localhost:${PORT}`);
});
