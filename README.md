# MTG Card Explainer

AI-powered Magic: The Gathering card explanations. Search or browse any card and get a plain-English breakdown of what it does, powered by Claude.

## Features

- Browse and search all MTG cards (via Scryfall bulk data)
- Filter by color, type, and set
- Click any card for a full detail view
- Claude AI explains each card in plain English for new players
- Explanations cached in PostgreSQL to avoid redundant API calls
- Card images served from AWS S3

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma** + **PostgreSQL** (hosted on Railway)
- **Claude API** (`claude-3-5-haiku`) for card explanations
- **AWS S3** for card image storage
- **Docker** multi-stage build
- **Railway** for hosting

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL database
- AWS S3 bucket (public read)
- Anthropic API key

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Import cards from Scryfall (runs bulk download, ~500MB):
   ```bash
   # Import cards only (no image upload)
   npx tsx scripts/import.ts

   # Import cards + upload images to S3
   npx tsx scripts/import.ts --with-images

   # Test with a small subset
   npx tsx scripts/import.ts --limit=500
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |

## Deploying to Railway

1. Push this repo to GitHub.
2. Create a new Railway project and connect the GitHub repo.
3. Add a **PostgreSQL** plugin to the project.
4. Set all environment variables in the Railway dashboard.
5. Railway will auto-detect the `Dockerfile` and deploy.
6. After first deploy, run the import script locally pointing at production DB:
   ```bash
   DATABASE_URL="<railway-postgres-url>" npx tsx scripts/import.ts
   ```

## S3 Bucket Policy

Make card images publicly readable by attaching this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
  }]
}
```

## Credits

- Card data by [Scryfall](https://scryfall.com) under the Wizards of the Coast Fan Content Policy
- Magic: The Gathering is ™ & © Wizards of the Coast
