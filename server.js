const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Discord Configuratie (Vul hier jouw gegevens in!)
const CLIENT_ID = '1538600876523004004';
const CLIENT_SECRET = 'LTChnaNPuGlgOr4GhzQDTLX6u3nNmDIC';
const REDIRECT_URI = 'https://soldaatvanoranje-draaischijf.onrender.com/auth/discord/callback';
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = '1470855740993306808';
const REQUIRED_ROLE_ID = '1537453646718050314';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'neodimium_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Statische bestanden (public map) direct beschikbaar maken
app.use(express.static(path.join(__dirname, 'public')));

let latestCommand = null;

// Discord Login Start
app.get('/auth/discord', (req, res) => {
    const discordLoginUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read`;
    res.redirect(discordLoginUrl);
});

// Discord Callback & Rol Check
app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('Geen code ontvangen.');

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

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const memberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const hasRole = memberResponse.data.roles.includes(REQUIRED_ROLE_ID);

        if (!hasRole) {
            return res.send('<h2>Toegang geweigerd</h2><p>Je hebt de juiste Discord-rol niet.</p>');
        }

        req.session.user = {
            username: userResponse.data.username,
            authenticated: true
        };

        res.redirect('/');
    } catch (error) {
        console.error('Login fout:', error.response?.data || error.message);
        res.send('Er is iets misgegaan tijdens het inloggen.');
    }
});

// Check of gebruiker is ingelogd voor acties
function checkAuth(req, res, next) {
    if (req.session.user && req.session.user.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Niet ingelogd' });
    }
}

// Actie doorsturen naar Roblox
app.post('/command-action', checkAuth, (req, res) => {
    latestCommand = req.body;
    res.json({ success: true });
});

// Roblox haalt commando op
app.get('/command', (req, res) => {
    res.json(latestCommand || {});
    latestCommand = null;
});

app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
});
