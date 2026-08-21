const express = require('express');
const path = require('path');
const app = express();

// Middleware voor het paren van JSON en het bedienen van statische bestanden
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Opslag voor het meest recente commando
let latestCommand = { action: "none" };

// Endpoint voor Roblox om te pollen
app.get('/command', (req, res) => {
    // Stuur het huidige commando mee naar Roblox
    res.json(latestCommand);

    // DIRECT WISSEN: Zodra Roblox het commando heeft opgehaald, 
    // resetten we het naar "none" zodat het niet blijft spammen!
    if (latestCommand.action !== "none") {
        latestCommand = { action: "none" };
    }
});

// Endpoint voor de website om acties/commando's te versturen
app.post('/command-action', (req, res) => {
    latestCommand = req.body;
    console.log("Commando ontvangen vanuit web UI:", latestCommand);
    res.json({ success: true, command: latestCommand });
});

// Zorg ervoor dat de root-URL netjes de index.html laadt
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start de server op de poort van de omgeving (zoals Render) of lokaal op poort 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server draait succesvol op poort ${PORT}`);
});
