# SecureU

SecureU is a polished cybersecurity awareness and incident reporting prototype built for a software engineering final project.

## What this version includes
- improved modern landing page UI
- redesigned SecureU logo and shield mark
- animated hero, reveal effects, and enhanced visual sections
- structured incident reporting form
- separate admin portal and dashboard
- admin status updates for submitted reports
- SQLite database for demo data persistence

## Tech stack
- Node.js
- Express
- better-sqlite3
- HTML, CSS, JavaScript

## How to run locally
1. Download or clone the project.
2. Open the project folder in VS Code.
3. Open a terminal in the project folder.
4. Install dependencies:
   npm install
5. Start the server:
   npm start
6. Open your browser and go to:
   http://localhost:3000

## User pages
- Home page: `/`
- Admin login: `/admin-login.html`

## Demo admin credentials
- Username: `admin`
- Password: `admin123`

## Demo flow suggestion
1. Show the public home page.
2. Open the awareness hub.
3. Submit a sample incident report.
4. Go to the admin portal.
5. Log in as admin.
6. Show the submitted report in the dashboard.
7. Change the report status to show workflow progress.

## Notes
- Incident reports are stored in `db/secureu.db`.
- The admin portal is visually separated from the public user platform.
