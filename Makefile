.PHONY: infras init test-all test-a01 test-a03 test-a04 test-a07 test-sequential

infras:
	docker compose -f infras/docker-compose.yml up -d
	PowerShell -Command "Start-Sleep -Seconds 5"
	npm run initdb
	npm run initdata

users:
	docker compose -f infras/docker-compose.yml exec -T postgres psql -U postgres -d chamcong -c "SELECT id, username, password, failed_attempts, locked_until, role FROM users ORDER BY id;"

de-infras:
	docker compose -f infras/docker-compose.yml down -v
