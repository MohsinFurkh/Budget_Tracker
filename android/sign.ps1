# Aligns and signs the release APK and AAB produced by gradlew.
# Usage: powershell -File sign.ps1   (run from the android/ folder)
$ErrorActionPreference = 'Stop'

$buildTools = "$env:USERPROFILE\.bubblewrap\android_sdk\build-tools\34.0.0"
$jdk = "$env:USERPROFILE\.bubblewrap\jdk17"
$pw = (Get-Content "$PSScriptRoot\keystore-password.txt" -Raw).Trim()
$keystore = "$PSScriptRoot\signing.keystore"

$unsignedApk = "$PSScriptRoot\app\build\outputs\apk\release\app-release-unsigned.apk"
$alignedApk = "$PSScriptRoot\app-release-aligned.apk"
$finalApk = "$PSScriptRoot\BudgetTracker.apk"
$unsignedAab = "$PSScriptRoot\app\build\outputs\bundle\release\app-release.aab"
$finalAab = "$PSScriptRoot\BudgetTracker.aab"

# APK: zipalign then apksigner
& "$buildTools\zipalign.exe" -f -p 4 $unsignedApk $alignedApk
& "$buildTools\apksigner.bat" sign --ks $keystore --ks-key-alias android `
    --ks-pass "pass:$pw" --key-pass "pass:$pw" --out $finalApk $alignedApk
Remove-Item $alignedApk -Force
& "$buildTools\apksigner.bat" verify $finalApk
Write-Host "Signed APK: $finalApk"

# AAB: jarsigner (Play Store re-signs bundles on upload)
if (Test-Path $unsignedAab) {
    Copy-Item $unsignedAab $finalAab -Force
    & "$jdk\bin\jarsigner.exe" -keystore $keystore -storepass $pw -keypass $pw `
        -digestalg SHA-256 -sigalg SHA256withRSA $finalAab android | Out-Null
    Write-Host "Signed AAB: $finalAab"
}
