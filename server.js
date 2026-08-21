const express = require('express');
const path = require('path');
const app = express();

// Middleware voor het paren van JSON en statische bestanden
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Opslag voor het meest recente commando
let latestCommand = { action: "none" };

// Endpoint voor Roblox om te pollen
app.get('/command', (req, res) => {
    res.json(latestCommand);

    // DIRECT WISSEN: Voorkom oneindige herhalingen
    if (latestCommand.action !== "none") {
        latestCommand = { action: "none" };
    }
});

// Endpoint voor de website om acties/commando's te versturen (inclusief dynamische duur)
app.post('/command-action', (req, res) => {
    latestCommand = req.body;
    console.log("Commando ontvangen vanuit web UI:", latestCommand);
    res.json({ success: true, command: latestCommand });
});

// Root-URL laadt index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start de server op Render of lokaal poort 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait succesvol op poort ${PORT}`);
});
