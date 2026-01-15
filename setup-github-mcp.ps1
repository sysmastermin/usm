# GitHub MCP 서버 설정 스크립트
# 이 스크립트를 실행하여 GitHub Personal Access Token을 환경 변수로 설정합니다.

Write-Host "GitHub MCP 서버 설정" -ForegroundColor Green
Write-Host ""

$token = Read-Host "GitHub Personal Access Token을 입력하세요"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "토큰이 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 사용자 환경 변수로 설정
[System.Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", $token, "User")

Write-Host ""
Write-Host "환경 변수가 설정되었습니다!" -ForegroundColor Green
Write-Host "Cursor를 재시작하면 GitHub MCP 서버가 연결됩니다." -ForegroundColor Yellow
Write-Host ""
Write-Host "참고: 현재 세션에서는 다음 명령으로 환경 변수를 설정할 수 있습니다:" -ForegroundColor Cyan
Write-Host "`$env:GITHUB_PERSONAL_ACCESS_TOKEN = '$token'" -ForegroundColor Gray

