import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collégé API Documentation',
      version: '1.0.0',
      description: `
# Collégé – Meet. Chat. Connect.
### 18+ College Social Connection Platform Backend API

This backend is built entirely with Node.js, Express.js, and a safe atomic JSON storage engine without requiring a traditional database setup.

---
### Key Policies & Security Architecture:
1. **100% Manual Human Administrator Verification**: No user account is activated automatically.
2. **Mandatory 3 Photographs**: Every applicant must submit 3 verified photographs (Avatar + 2 Personal).
3. **Private Vault Storage**: Identity documents and photos are stored in encrypted private folders and served exclusively to authorized admins via streams.
4. **72-Hour Target SLA**: Applications track a 72-hour review timeline, flagging applications older than 72 hours as \`OVERDUE\`.
5. **Strict Access Guard**: Only accounts with status \`ACTIVE\` and verification \`APPROVED\` can access community discovery, profiles, and chat.
      `,
      contact: {
        name: 'Collégé Engineering & Security Lead',
        email: 'security@college.internal'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token obtained from /api/v1/auth/login'
        }
      }
    }
  },
  apis: ['./src/modules/**/*.routes.js', './src/app.js']
};

export const swaggerSpec = swaggerJsdoc(options);
