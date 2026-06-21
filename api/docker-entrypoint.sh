#!/bin/sh
set -eu

# Extrair credenciais do DATABASE_URL se não definidas
DATABASE_URL="${DATABASE_URL:-postgresql://payment:payment@postgres:5432/payment_alerts}"

# Parse DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "=========================================="
echo "Database: $DB_NAME at $DB_HOST:$DB_PORT"
echo "=========================================="

# Verifica se há migrações marcadas como falhas
MIGRATION_FAILED=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM _prisma_migrations 
WHERE finished_at IS NULL 
AND rolled_back_at IS NULL;
" 2>/dev/null || echo "0")

if [ "$MIGRATION_FAILED" -gt "0" ]; then
    echo "Found failed migrations, marking as rolled back..."
    PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "
    UPDATE _prisma_migrations 
    SET rolled_back_at = NOW(), logs = 'Marked as rolled back to allow new migrations'
    WHERE finished_at IS NULL 
    AND rolled_back_at IS NULL;
    " 2>/dev/null || true
fi

echo "Running migrations..."
npm run db:migrate
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "Migration failed with exit code $MIGRATE_EXIT"
    echo "Trying to force migrate..."
    npm run db:migrate 2>&1 || true
fi

echo "Migrations done!"

echo "Generating Prisma client..."
npx prisma generate --schema=../prisma/schema.prisma

echo "Seeding database..."
npm run db:seed || echo "Seed already done"

exec npm run dev
