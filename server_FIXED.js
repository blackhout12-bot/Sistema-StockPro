// server_FIXED.js (FRAGMENTO CORREGIDO PARA APLICAR EN PRODUCCIÓN)
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// ─── MITIGACIÓN VULN-005: CSP Activada (Strict Mode) ────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Ajustar según React build
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// ─── MITIGACIÓN VULN-001: CORS Estricto (No Wildcards) ──────────
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : ['https://stockpro-erp.production.local'];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (ej: mobile apps o curl) si se desea, o bloquearlos:
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Exportar configuración segura
module.exports = app;
