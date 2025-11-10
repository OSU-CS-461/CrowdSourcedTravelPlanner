import "dotenv/config";
import app from "./app";


import { PrismaClient } from './generated/prisma/client';



const prisma = new PrismaClient();

// --- Endpoints ---

import { default as experienceRouter } from './routes/experiences';
app.use('/experiences', experienceRouter);



// Only start server if this file is run directly 
// (Allows for testing with supertest)
if (require.main === module) {
  const PORT = 10000;
  app.listen(PORT, () => {
    console.log(`App listening on http://localhost:${PORT}`);
  });
}