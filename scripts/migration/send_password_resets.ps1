param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$ResendApiKey = $env:RESEND_API_KEY,
  [string]$AuthUsersPath = "scripts/migration/auth_users.json",
  [string]$FromEmail = "ReUNE <noreply@reuneapp.com.br>",
  [string]$AppName = "ReUNE",
  [string]$RedirectUrl = "https://reuneapp.com.br/reset-password",
  [switch]$DryRun
)

if (-not $SupabaseUrl) { throw "SUPABASE_URL nao definido (env)." }
if (-not $ServiceRoleKey) { throw "SUPABASE_SERVICE_ROLE_KEY nao definido (env)." }
if (-not $ResendApiKey) { throw "RESEND_API_KEY nao definido (env)." }

$authUsers = Get-Content -LiteralPath $AuthUsersPath -Raw | ConvertFrom-Json

$adminHeaders = @{
  Authorization = "Bearer $ServiceRoleKey"
  apikey = $ServiceRoleKey
  "Content-Type" = "application/json"
}

$resendHeaders = @{
  Authorization = "Bearer $ResendApiKey"
  "Content-Type" = "application/json"
}

function New-RecoveryLink([string]$Email) {
  $body = @{
    type = "recovery"
    email = $Email
    redirect_to = $RedirectUrl
  } | ConvertTo-Json -Depth 5 -Compress

  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $resp = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/admin/generate_link" -Headers $adminHeaders -Body $bodyBytes
  return $resp.action_link
}

function Send-ResetEmail([string]$Email, [string]$ActionLink) {
  $subject = "$AppName - redefinicao de senha"
  $html = @"
<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
    <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:12px; padding:24px;">
      <h2 style="margin:0 0 12px 0; color:#111;">Ola!</h2>
      <p style="margin:0 0 12px 0; color:#333;">Fizemos uma atualizacao no $AppName e precisamos que voce defina uma nova senha para continuar acessando sua conta.</p>
      <p style="margin:0 0 20px 0; color:#333;">E rapido e leva menos de 1 minuto.</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="$ActionLink" style="background:#ff6b35; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px; display:inline-block;">Redefinir senha</a>
      </p>
      <p style="margin:0; color:#666; font-size:12px;">Se voce nao solicitou isso, pode ignorar este email.</p>
    </div>
  </body>
</html>
"@

  $payload = @{
    from = $FromEmail
    to = @($Email)
    subject = $subject
    html = $html
  } | ConvertTo-Json -Depth 5 -Compress

  $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  Invoke-RestMethod -Method Post -Uri "https://api.resend.com/emails" -Headers $resendHeaders -Body $payloadBytes | Out-Null
}

Write-Host "Enviando reset de senha para $($authUsers.Count) usuarios"

foreach ($u in $authUsers) {
  $email = $u.email
  try {
    $link = New-RecoveryLink -Email $email
    if ($DryRun) {
      Write-Host "[dry-run] $email -> $link"
      continue
    }
    Send-ResetEmail -Email $email -ActionLink $link
    Write-Host "[ok] enviado: $email"
  } catch {
    Write-Host "[erro] $email: $($_.Exception.Message)"
  }
}

Write-Host "Envio concluido."

