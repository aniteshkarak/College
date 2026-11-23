import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collage Story API – Meet. Chat. Connect.',
      version: '1.0.0',
      description: `
Collage Story is an 18+ college-exclusive social networking and dating platform for verified adult students across India.

### Core Features:
- **100% Manual Admin Verification (72-Hour Review SLA)**
- **Multer File Upload**: Multi-part upload for 3 profile photographs + 1 College ID document
- **Sharp Image Optimization**: WebP conversion, EXIF/GPS stripping, resolution validation, discovery & thumbnail variants
- **Nodemailer Transactional Email**: Automated notifications for submission, review, approval, rejection, and correction
- **PostgreSQL & Prisma ORM**: Transactional application approval creating active user accounts
- **Strict Gatekeeping**: Only approved accounts can access discovery, match requests, and chat.
      `,
      contact: {
        name: 'Collage Story Engineering Team',
        email: 'dev@college.internal',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
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
  },
  apis: ['./src/modules/**/*.routes.js', './src/app.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
