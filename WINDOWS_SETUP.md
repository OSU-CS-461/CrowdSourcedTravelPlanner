# Windows Setup and User Guide

This comprehensive guide will help you set up and use the CrowdSourcedTravelPlanner project on Windows.

## Prerequisites

### 1. Install Node.js

**Important:** The project requires Node.js version **20.19+ or 22.12+** (Vite requirement).

**Method 1: Direct installation (Easiest)**
1. Visit https://nodejs.org/
2. Download and install **Node.js 22.x LTS** (Long Term Support) - recommended
3. Verify installation: Open PowerShell and run `node --version`
4. You should see v22.x.x or higher

**Method 2: Using nvm-windows (For managing multiple versions)**
1. Download and install nvm-windows: https://github.com/coreybutler/nvm-windows/releases
2. Install the latest `nvm-setup.exe`
3. **Restart your computer** or close all terminal windows
4. Open PowerShell and run:
   ```powershell
   nvm install 22.12.0
   nvm use 22.12.0
   ```
5. Verify: `node --version`

### 2. Install Git (if not already installed)
- Visit https://git-scm.com/download/win to download and install

**Note:** You don't need to install PostgreSQL separately. The project uses Prisma's development database which will be started automatically.

## First Time Setup

### Step 1: Install Dependencies

Open PowerShell in the project root directory:

```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Generate Prisma Client

```powershell
cd server
npx prisma generate
```

This generates the Prisma client needed to interact with the database.

### Step 3: Configure Environment Variables

1. Navigate to the `server` directory
2. Create a `.env` file

**Generate JWT Secret:**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated string (a long hexadecimal string).

3. Create the `.env` file with this template:

```env
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=your_api_key_here"
JWT_SECRET="paste-your-generated-jwt-secret-here"
NODE_ENV="development"
```

Replace `paste-your-generated-jwt-secret-here` with the JWT secret you generated.

### Step 4: Start Prisma Development Database

1. In the `server` directory, run:
   ```powershell
   npx prisma dev
   ```

2. Wait for the output:
   ```
   Great Success!
   Your _prisma dev_ server default is ready and listening on ports 51213-51215.
   ```

3. **Press `h` key** in the Prisma dev window to print the HTTP URL

4. Copy the `DATABASE_URL` value (the entire string in quotes)

5. Open `server/.env` and replace the `DATABASE_URL` line with the copied value

6. **Keep the Prisma dev window running** - don't close it!

### Step 5: Run Database Migrations

In a new PowerShell window (keep Prisma dev running):

```powershell
cd server
npx prisma migrate dev
```

This creates all necessary database tables (User, Experience, Review).

## Running the Project

### Option 1: Using the Startup Script (Recommended)

From the project root directory:

```powershell
.\start-dev.ps1
```

This script will:
- Check Node.js version
- Install dependencies if needed
- Start the server and client in separate windows
- Open your browser to http://localhost:5173

**Note:** Make sure Prisma dev is already running before using this script.

### Option 2: Manual Start

You'll need **three separate PowerShell windows**:

**Window 1: Prisma Dev Database** (keep running)
```powershell
cd server
npx prisma dev
```

**Window 2: Server**
```powershell
cd server
npm run start:dev
```
Server runs on http://localhost:10000

**Window 3: Client**
```powershell
cd client
npm run dev
```
Client runs on http://localhost:5173

## Using the Application

### 1. Register a New Account

1. Open your browser: **http://localhost:5173**
2. Click "Signup" (or visit http://localhost:5173/signup)
3. Fill in the form:
   - **Username**: Any username (e.g., `myuser`)
   - **Email**: Any email (e.g., `user@test.com`)
   - **Password**: At least 8 characters (e.g., `password123`)
   - **Confirm password**: Same password
4. Click "Create account"
5. You'll be automatically logged in and redirected to the home page

### 2. Login (If You Already Have an Account)

1. Go to: **http://localhost:5173/login**
2. Enter your email and password
3. Click "Continue"

### 3. Home Page Features

After logging in, you'll see:
- **Welcome message** and description
- **"Create Experience" button** to add new experiences
- **Experience cards** showing all travel experiences with:
  - Thumbnail image
  - Title
  - Location (city, region, country)
  - Rating (if available)
  - Keywords tags
  - Creation date
  - **Edit button** (only for your own experiences)

### 4. View Experience Details

- **Click any experience card** to view full details
- The detail page shows:
  - Full-size image
  - Complete description
  - Location information
  - Keywords
  - Rating
  - Creation and update dates
  - **Edit and Delete buttons** (only for your own experiences)

### 5. Create a New Experience

1. Click "Create Experience" button on the home page
2. Fill in the form:
   - **Title**: Experience title (required, min 3 characters)
   - **Description**: Detailed description (required, min 20 characters)
   - **Country**: 2-letter ISO code (e.g., `US`, `GB`, `CN`) - **required**
   - **State/Region**: Optional
   - **City**: Optional (required if street/postal code provided)
   - **Street**: Optional (required if postal code provided)
   - **Postal Code**: Optional (requires street, city, and region)
   - **Latitude/Longitude**: Optional (must provide both or neither)
   - **Image URL**: Optional thumbnail image URL
   - **Keywords**: Comma-separated keywords (optional)
3. Click "Create"
4. You'll be redirected to the home page with your new experience

**Important Notes:**
- Country must be a 2-letter ISO code (US, GB, CN, etc.)
- Description must be at least 20 characters
- If you provide latitude, you must also provide longitude (and vice versa)
- If you provide postal code, you must also provide street, city, and region

### 6. Edit an Experience

**Option 1: From Home Page**
- Find your experience card
- Click the "Edit" button on the card

**Option 2: From Detail Page**
- Click on your experience card to view details
- Click the "Edit" button at the top

The edit form is pre-filled with current values. Make your changes and click "Update".

### 7. Delete an Experience

1. Click on your experience card to view details
2. Click the "Delete" button at the top
3. Confirm the deletion
4. The experience will be removed and you'll be redirected to the home page

**Note:** You can only edit or delete experiences you created.

## Troubleshooting

### Node.js Version Too Old

**Error:** `You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+`

**Solution:**
1. Upgrade Node.js to 20.19+ or 22.12+ (22.x LTS recommended)
2. Download from: https://nodejs.org/
3. After installing, close all terminal/PowerShell windows
4. Open a new PowerShell window and verify: `node --version`
5. Run the project again

### Signup/Login Fails

**Possible causes:**
1. Database not initialized - Run `npx prisma migrate dev` in the server directory
2. Prisma dev not running - Start it with `npx prisma dev`
3. Wrong DATABASE_URL - Get the correct URL from Prisma dev (press `h`) and update `.env`

**Solution:**
1. Make sure Prisma dev is running and shows "Great Success!"
2. Check that `server/.env` has the correct DATABASE_URL from Prisma dev
3. Restart the server after updating `.env`

### Experience Creation Fails

**Common errors:**
- "Country must be a 2-character ISO code" - Use country codes like `US`, `GB`, `CN` instead of full names
- "Description must be at least 20 characters" - Write a longer description
- "Latitude and longitude must both be provided together" - Provide both or leave both empty

**Solution:** Follow the form validation messages and requirements listed above.

### Port Already in Use

If ports 10000 or 5173 are already in use:
- **Server port:** Modify the `PORT` variable in `server/src/index.ts`
- **Client port:** Vite will automatically select the next available port (check terminal output)

### Services Won't Start

1. **Check Node.js version:** `node --version` (should be 20.19+ or 22.12+)
2. **Reinstall dependencies:**
   ```powershell
   cd server
   Remove-Item -Recurse -Force node_modules
   npm install
   
   cd ../client
   Remove-Item -Recurse -Force node_modules
   npm install
   ```
3. **Regenerate Prisma client:**
   ```powershell
   cd server
   npx prisma generate
   ```

## Quick Reference

### First Time Setup Checklist
- [ ] Node.js 20.19+ or 22.12+ installed
- [ ] Dependencies installed (`npm install` in both `server` and `client`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] `.env` file created in `server` directory
- [ ] JWT_SECRET generated and added to `.env`
- [ ] Prisma dev started and DATABASE_URL copied to `.env`
- [ ] Database migrations run (`npx prisma migrate dev`)

### Daily Startup
1. Start Prisma dev: `cd server && npx prisma dev` (keep running)
2. Run startup script: `.\start-dev.ps1`
3. Or manually start server and client in separate windows

### Stopping Services
- Close all PowerShell windows running the services
- Prisma dev, server, and client will stop when their windows are closed

## Application Features Summary

**User Authentication**
- Register new accounts
- Login with email and password
- Secure password hashing
- Session management

**Experience Management**
- Create travel experiences with rich details
- View all experiences in a beautiful card layout
- View individual experience details
- Edit your own experiences
- Delete your own experiences

**User Interface**
- Modern, responsive design
- Dark theme
- Image previews
- Keyword tags
- Rating display
- Location information

## Next Steps

- Check `client/README.md` for client development details
- Check `server/README.md` for server development details
- Visit http://localhost:5173 to start using the application
