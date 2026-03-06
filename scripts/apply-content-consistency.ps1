$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$utf8NoBomStrict = New-Object System.Text.UTF8Encoding($false, $true)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
$utf16Le = [System.Text.Encoding]::Unicode
$utf16Be = [System.Text.Encoding]::BigEndianUnicode
$cp949 = [System.Text.Encoding]::GetEncoding(949)

function Read-TextWithEncoding {
    param([string]$Path)

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        return [PSCustomObject]@{ Text = $utf8NoBom.GetString($bytes, 3, $bytes.Length - 3); Encoding = $utf8Bom }
    }

    if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
        return [PSCustomObject]@{ Text = $utf16Le.GetString($bytes, 2, $bytes.Length - 2); Encoding = $utf16Le }
    }

    if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
        return [PSCustomObject]@{ Text = $utf16Be.GetString($bytes, 2, $bytes.Length - 2); Encoding = $utf16Be }
    }

    try {
        $text = $utf8NoBomStrict.GetString($bytes)
        return [PSCustomObject]@{ Text = $text; Encoding = $utf8NoBom }
    }
    catch {
        $text = $cp949.GetString($bytes)
        return [PSCustomObject]@{ Text = $text; Encoding = $cp949 }
    }
}

function Write-TextWithEncoding {
    param(
        [string]$Path,
        [string]$Text,
        [System.Text.Encoding]$Encoding
    )

    [System.IO.File]::WriteAllText($Path, $Text, $Encoding)
}

function Get-AssetHref {
    param([string]$FilePath)

    $relative = $FilePath.Substring($repoRoot.Length).TrimStart('\\')
    $relative = $relative -replace '/', '\\'
    $relDir = Split-Path -Parent $relative

    if ([string]::IsNullOrWhiteSpace($relDir)) {
        return 'assets/content-consistency.css'
    }

    $depth = ($relDir -split '\\').Count
    $prefix = '../' * $depth
    return "${prefix}assets/content-consistency.css"
}

$files = Get-ChildItem -Path $repoRoot -Recurse -Filter *.html |
    Where-Object {
        $_.Name -ne 'index.html' -and
        $_.FullName -notlike '*\\archive\\*'
    }

$updated = 0
$skipped = 0

foreach ($file in $files) {
    $read = Read-TextWithEncoding -Path $file.FullName
    $text = $read.Text

    if ($text -notmatch '</head>') {
        $skipped++
        continue
    }

    $href = Get-AssetHref -FilePath $file.FullName
    $line = "  <link rel=`"stylesheet`" href=`"$href`">"

    if ($text -match 'content-consistency\.css') {
        $newText = [regex]::Replace(
            $text,
            '<link\s+rel="stylesheet"\s+href="[^"]*content-consistency\.css">',
            [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $line },
            1
        )
    }
    else {
        $newText = $text -replace '</head>', "$line`r`n</head>"
    }

    if ($newText -ne $text) {
        Write-TextWithEncoding -Path $file.FullName -Text $newText -Encoding $read.Encoding
        $updated++
    }
    else {
        $skipped++
    }
}

Write-Output "updated=$updated skipped=$skipped"
