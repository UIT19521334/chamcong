# CHAM CONG

## Quick Start

1. Install dependencies:

    ```sh
    npm install
    ```
2. Initialize infrastructure:

    ```sh
    docker compose -f infras/docker-compose.yml exec -T postgres psql -U postgres -c "CREATE DATABASE chamcong;"

    docker compose -f infras/docker-compose.yml up -d
    ```

3. Initialize the database and seed demo users:

    ```bash
    npm run initdb
    npm run initdata
    ```

4. Start the app:

    ```sh
    npm start
    ```

App will be running at http://localhost:3000