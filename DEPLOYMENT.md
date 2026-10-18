# Run and deploy

Use Node.js 22 and run commands from the project root.

```sh
npm ci
npm run build
npm test
npm run test:integration
```

The integration suite starts a temporary real MongoDB process and deletes only
its isolated test database. It never uses your MONGODB_URI. The first run needs
internet access to download MongoDB and permission to run the binary. GitHub
Actions runs these same checks on pushes and pull requests.

For development, keep using backend/.env and the existing development scripts.
For a Node hosting service, configure these environment variables in its dashboard:

| Variable | Production value |
| --- | --- |
| NODE_ENV | production |
| HOST | 0.0.0.0 |
| PORT | Provider-assigned port, or 3001 |
| MONGODB_URI | Your MongoDB connection string |
| MONGODB_DBNAME | art_expo, or your chosen database |
| JWT_SECRET | A long randomly generated secret |

Build command: `npm ci --include=dev && npm run build`

Start command: `npm start`

Express serves the built React frontend and /api on the same origin, including
React Router deep links. Use HTTPS: production login cookies require it.
Do not set a separate frontend API domain. Configure your MongoDB network access
for the hosting service and keep credentials in its environment settings.

For a new empty database, run `npm run seed --workspace backend` deliberately;
do not add seeding to the start command. Register your account normally, then run
`npm run user:role --workspace backend -- YOUR_USERNAME organizador`
with the production database environment to grant organizer access.

After deployment, check login/logout, refresh a nested React route, create/edit
content as organizer, and register/cancel as visitor. A visitor must receive 403
on organizer API writes. `/api/does-not-exist` must return JSON 404.

Publishing still requires your repository and hosting account. No remote
repository or public URL is created by extracting this archive. Never commit .env.
