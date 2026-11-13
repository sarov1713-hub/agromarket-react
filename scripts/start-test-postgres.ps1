param([string]$PgBin = (Join-Path $PSScriptRoot '..\.lab12-local\pgsql\bin'))
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$localRoot = Join-Path $projectRoot '.lab12-local'
$dataDir = Join-Path $localRoot 'pgdata'
$envFile = Join-Path $projectRoot '.env.e2e'
if (-not (Test-Path (Join-Path $PgBin 'initdb.exe'))) { throw 'Укажите -PgBin с bin официальных PostgreSQL binaries. См. README.' }
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
    if (Test-Path $envFile) { throw '.env.e2e уже существует. Для нового кластера используйте его настройки вручную; файл не перезаписан.' }
    $dbPassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $adminPassword = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $secret = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $pwFile = Join-Path $localRoot 'bootstrap.pw'
    [IO.File]::WriteAllText($pwFile, $dbPassword, [Text.UTF8Encoding]::new($false))
    try {
        & (Join-Path $PgBin 'initdb.exe') -D $dataDir -U postgres --pwfile=$pwFile --auth=scram-sha-256 --encoding=UTF8 --locale=C
        if ($LASTEXITCODE -ne 0) { throw 'initdb завершился с ошибкой' }
    } finally { Remove-Item -LiteralPath $pwFile -ErrorAction SilentlyContinue }
    $lines = @(
        "E2E_DATABASE_URL=postgresql://postgres:$dbPassword@127.0.0.1:55432/agromarket_test",
        "E2E_JWT_SECRET=$secret", 'E2E_FARMER_EMAIL=admin@e2e.example.test',
        "E2E_FARMER_PASSWORD=$adminPassword", 'E2E_API_URL=http://127.0.0.1:3100/api'
    )
    [IO.File]::WriteAllLines($envFile, $lines, [Text.UTF8Encoding]::new($false))
}
& (Join-Path $PgBin 'pg_ctl.exe') -D $dataDir status *> $null
if ($LASTEXITCODE -ne 0) {
    & (Join-Path $PgBin 'pg_ctl.exe') -D $dataDir -l (Join-Path $localRoot 'postgresql.log') -o '-h 127.0.0.1 -p 55432' -w start
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось запустить локальную PostgreSQL' }
}
$settings = @{}
foreach ($line in [IO.File]::ReadAllLines($envFile)) {
    if ($line -match '^([^#=]+)=(.*)$') { $settings[$matches[1]] = $matches[2] }
}
$dbUrl = [Uri]$settings.E2E_DATABASE_URL
if ($dbUrl.Host -ne '127.0.0.1' -or $dbUrl.Port -ne 55432 -or $dbUrl.AbsolutePath -ne '/agromarket_test') { throw 'Ожидалась собственная локальная БД на 127.0.0.1:55432/agromarket_test' }
$env:PGPASSWORD = ($dbUrl.UserInfo -split ':',2)[1]
try {
    $found = & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p 55432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='agromarket_test'"
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось проверить тестовую БД' }
    if ($found -ne '1') {
        & (Join-Path $PgBin 'createdb.exe') -h 127.0.0.1 -p 55432 -U postgres --template=template0 --locale-provider=icu --icu-locale=ru-RU agromarket_test
        if ($LASTEXITCODE -ne 0) { throw 'Не удалось создать agromarket_test' }
    }
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
Write-Output 'Тестовая PostgreSQL готова: 127.0.0.1:55432/agromarket_test. Данные доступа только в игнорируемом .env.e2e.'
