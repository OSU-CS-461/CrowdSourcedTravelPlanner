# Prisma

Next steps:

1. Install `dotenv`, and add `import "dotenv/config";` to your `prisma.config.ts` file to load environment variables from `.env`.
2. Run prisma dev to start a local Prisma Postgres server.
3. Define models in the schema.prisma file.
4. Run prisma migrate dev to migrate your local Prisma Postgres database.
5. Tip: Explore how you can extend the ORM with scalable connection pooling, global caching, and a managed serverless Postgres database. Read: https://pris.ly/cli/beyond-orm

More information in our documentation:
https://pris.ly/d/getting-started

## Run DB

- `npx prisma dev`

## Generate Types

- `npx prisma generate`

## Upon Changes

After you make a change to the schema, generate a migration using `npx migrate dev` and then run `npx prisma generate` to generate types.
