const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stock System API',
            version: '1.0.0',
            description: 'Documentación de la API del Sistema de Gestión de Stock Multi-Tenant',
        },
        servers: [
            {
                url: '/api/v1',
                description: 'Servidor Base',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.js', './src/schemas/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
