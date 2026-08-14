# Daily fork sync (replacement for the schedule trigger GitHub disables in forks).
#
# Runs the fork's Release workflow: if npm has a newer @deepseek-ai/dsh it is
# adopted (version pinned + release built); otherwise the current pin is
# rebuilt with a patch bump. The built app's electron-updater then delivers
# the new release to installed clients.
#
# Setup once:  gh auth login
# Schedule:    Windows Task Scheduler or cron, daily is enough.
$ErrorActionPreference = 'Stop'
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error 'gh is not authenticated. Run: gh auth login'
}
gh workflow run release.yml
Write-Output ('fork-daily: release workflow triggered at ' + (Get-Date -Format o))