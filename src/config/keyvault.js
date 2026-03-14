// src/config/keyvault.js
require('dotenv').config();

/**
 * Servicio para obtener secretos dinámicamente desde Azure Key Vault o Secrets Manager.
 * Si se corre en un entorno local, hará fallback al archivo .env.
 */
class SecretsManager {
    constructor() {
        this.cache = new Map();
        this.useAzureKv = process.env.NODE_ENV === 'production' && process.env.AZURE_CLIENT_ID;
    }

    async getSecret(secretName) {
        // Retorna de caché si ya existe para reducir latencia
        if (this.cache.has(secretName)) {
            return this.cache.get(secretName);
        }

        let secretValue = null;

        if (this.useAzureKv) {
            // Lógica de @azure/keyvault-secrets se inicializaría aquí
            // const client = new SecretClient(vaultUrl, credential);
            // const secret = await client.getSecret(secretName);
            // secretValue = secret.value;
            secretValue = process.env[secretName]; // Simulado
            console.log(`[KeyVault] Obteniendo secreto de Azure: ${secretName}`);
        } else {
            // Entorno de desarrollo / Github Actions, usa ENV variables
            secretValue = process.env[secretName];
        }

        if (secretValue) {
            this.cache.set(secretName, secretValue);
        }

        return secretValue;
    }
}

module.exports = new SecretsManager();
