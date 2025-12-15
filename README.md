# CHAM CONG

## Quick Start

1. Install dependencies:

    ```sh
    npm install
    ```
2. Initialize infrastructure:

    ```sh
    docker compose -f infras/docker-compose.yml exec -T postgres psql -U postgres -c "CREATE DATABASE chamcong;"
    docker compose -f infras/docker-compose.yml exec -T postgres psql -U postgres -c "CREATE DATABASE kong;"

    docker compose -f infras/docker-compose.yml up -d
    ```

3. Initialize the database and seed demo users:

    ```bash
    npm run initdb
    npm run cleardata
    npm run initdata
    ```

4. Start the app:

    ```sh
    npm start
    ```

App will be running at http://localhost:3000

5. Kong connect

``` bash
curl -X POST http://localhost:8001/services --data name=ssr-app --data url=http://host.docker.internal:3000
```

```bash
curl -X POST http://localhost:8001/services/ssr-app/routes --data paths[]=/ --data strip_path=false
```
 
6. Open: http://localhost:8000/config