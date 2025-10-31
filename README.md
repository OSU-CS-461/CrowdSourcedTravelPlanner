# Shared Setup Steps

Both the client and server run on Node.js. So, node must be installed before running the client or server.

## MacOS

An easy way to manage your node versions is through nvm. This can be installed through the brew package manager.

1. Install brew package manager: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install node version manager: `brew install nvm`
3. `nvm install 23.10.0`
4. `nvm use 23.10.0`

# Local Dev

When developing locally, run the client and the server by following the README.md instructions in the each directory.

# Deployment Info

When the application is deployed, the client is built and served by the server. This is so we can hydrate the session on the first request, instead of serving the client and then making a request to check the session state.

For more information on deployment, checkout `render.yml`.

# Infra Info

- Render: Node application server, PostgreSQL db
- Cloudflare R2: Object store (for image upload)
