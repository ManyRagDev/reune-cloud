param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$AuthUsersPath = "scripts/migration/auth_users.json",
  [string]$ProfilesPath = "scripts/migration/profiles.json",
  [int]$ChunkSize = 200,
  [switch]$ClearOldAvatars
)

if (-not $SupabaseUrl) { throw "SUPABASE_URL nao definido (env)." }
if (-not $ServiceRoleKey) { throw "SUPABASE_SERVICE_ROLE_KEY nao definido (env)." }

$authUsers = Get-Content -LiteralPath $AuthUsersPath -Raw | ConvertFrom-Json
$profilesRaw = Get-Content -LiteralPath $ProfilesPath -Raw | ConvertFrom-Json

$headers = @{
  Authorization = "Bearer $ServiceRoleKey"
  apikey = $ServiceRoleKey
  "Content-Type" = "application/json"
}

function Get-ErrorBody($err) {
  try {
    if ($err.ErrorDetails -and $err.ErrorDetails.Message) {
      return $err.ErrorDetails.Message
    }
    $resp = $err.Exception.Response
    if ($null -eq $resp) { return $null }
    $stream = $resp.GetResponseStream()
    if ($null -eq $stream) { return $null }
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $reader.Close()
    return $body
  } catch {
    return $null
  }
}

Write-Host "Iniciando migracao de auth.users: $($authUsers.Count) usuarios"

foreach ($u in $authUsers) {
  $userId = $u.id
  $email = $u.email

  # Verificar se ja existe
  $getUrl = "$SupabaseUrl/auth/v1/admin/users/$userId"
  $exists = $false
  try {
    Invoke-RestMethod -Method Get -Uri $getUrl -Headers $headers | Out-Null
    $exists = $true
  } catch { }

  if ($exists) {
    Write-Host "[skip] user ja existe: $email ($userId)"
    continue
  }

  $body = @{
    id = $userId
    email = $email
    email_confirm = $true
    user_metadata = $u.raw_user_meta_data
  } | ConvertTo-Json -Depth 10

  try {
    Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/admin/users" -Headers $headers -Body $body | Out-Null
    Write-Host "[ok] criado: $email ($userId)"
  } catch {
    $details = Get-ErrorBody $_
    if ($details) {
      Write-Host "[erro] $email ($userId): $($_.Exception.Message) :: $details"
    } else {
      Write-Host "[erro] $email ($userId): $($_.Exception.Message)"
    }
  }
}

Write-Host "Iniciando upsert de profiles"

$profiles = @()
foreach ($p in $profilesRaw) {
  $avatarUrl = $p.avatar_url
  if ($ClearOldAvatars -and $avatarUrl -and $avatarUrl -match "tfrogqqqmgfgfybesglq") {
    $avatarUrl = $null
  }

  $profiles += [pscustomobject]@{
    id = $p.id
    display_name = $p.display_name
    username = $p.username
    avatar_url = $avatarUrl
    phone = $p.phone
    city = $p.city
    state = $p.state
    country = $p.country
    bio = $p.bio
    language = $p.language
    favorite_event_type = $p.favorite_event_type
    is_founder = $p.is_founder
    founder_since = $p.founder_since
    premium_until = $p.premium_until
    storage_multiplier = $p.storage_multiplier
    accept_notifications = $p.accept_notifications
    allow_search_by_username = $p.allow_search_by_username
    hide_profile_prompt = $p.hide_profile_prompt
    terms_accepted_at = $p.terms_accepted_at
    created_at = $p.created_at
    updated_at = $p.updated_at
  }
}

$preferHeaders = $headers.Clone()
$preferHeaders["Prefer"] = "resolution=merge-duplicates,return=minimal"

for ($i = 0; $i -lt $profiles.Count; $i += $ChunkSize) {
  $chunk = $profiles[$i..([Math]::Min($i + $ChunkSize - 1, $profiles.Count - 1))]
  $chunkArray = @($chunk)
  $body = $chunkArray | ConvertTo-Json -Depth 10 -Compress
  if ([string]::IsNullOrWhiteSpace($body)) {
    Write-Host "[erro] upsert profiles: JSON vazio gerado para chunk $i"
    continue
  }

  $payloadPath = "scripts/migration/profiles_payload.json"
  $body | Set-Content -LiteralPath $payloadPath
  Write-Host "[debug] payload salvo em $payloadPath"

  try {
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/rest/v1/profiles?on_conflict=id" -Headers $preferHeaders -Body $bodyBytes | Out-Null
    Write-Host "[ok] upsert profiles: $($chunkArray.Count) registros"
  } catch {
    $details = Get-ErrorBody $_
    if ($details) {
      Write-Host "[erro] upsert profiles: $($_.Exception.Message) :: $details"
    } else {
      Write-Host "[erro] upsert profiles: $($_.Exception.Message)"
    }
  }
}

Write-Host "Migracao concluida."

