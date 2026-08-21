const express = require('express');
const path = require('path');
const app = express();

// Middleware voor JSON en statische bestanden
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Opslag voor het meest recente commando
let latestCommand = { action: "none" };

// Endpoint voor Roblox om te pollen
app.get('/command', (req, res) => {
    res.json(latestCommand);

    // DIRECT WISSEN: Voorkom dat Roblox herhaaldelijk hetzelfde commando uitvoert
    if (latestCommand.action !== "none") {
        latestCommand = { action: "none" };
    }
});

// Endpoint voor de website om acties te versturen
app.post('/command-action', (req, res) => {
    latestCommand = req.body;
    console.log("Commando ontvangen vanuit web UI:", latestCommand);
    res.json({ success: true, command: latestCommand });
});

// Root-URL laadt index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start de server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait succesvol op poort ${PORT}`);
});
