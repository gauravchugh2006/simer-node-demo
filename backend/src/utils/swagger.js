import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Cafe Coffee Day API',
    version: '1.0.0',
    description: 'API documentation for the Cafe Coffee Day platform.'
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || 'http://localhost:4000',
      description: 'Primary API server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
