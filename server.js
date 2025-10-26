require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.static('public'));

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour vérifier le reCAPTCHA
app.post('/verify-recaptcha', async (req, res) => {
    try {
        const { token } = req.body;
        // Debug: vérifier que nous avons bien reçu un token
        if (!token) {
            console.warn('Aucun token reCAPTCHA reçu dans le corps de la requête');
            return res.status(400).json({ success: false, error: 'token_missing' });
        }
        // Log court du token pour debug (ne pas logger en production)
        try {
            const visible = token.length > 10 ? token.slice(0, 10) + '...' : token;
            console.log(`Token reçu (trunc): ${visible} (len=${token.length})`);
        } catch (e) {
            console.log('Impossible de logguer le token:', e);
        }
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        // Vérifier que la clé secrète est définie
        if (!secretKey) {
            console.error('RECAPTCHA_SECRET_KEY non défini dans les variables d\'environnement');
            return res.status(500).json({ success: false, error: 'missing_secret_key' });
        }

        // Vérifier le token avec l'API Google
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: secretKey,
                response: token
            }
        });

    console.log('reCAPTCHA response:', response.data);  // Pour le débogage

        // Renvoyer le résultat de la vérification
        res.json(response.data);
    } catch (error) {
        console.error('Erreur lors de la vérification du reCAPTCHA:', error);
        res.status(500).json({ success: false, error: 'Erreur de vérification' });
    }
});

// Route pour exposer la clé de site (frontend la récupère dynamiquement)
app.get('/config', (req, res) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY || '' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});