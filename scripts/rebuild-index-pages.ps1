$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$primaryOrder = @{
    '어휘' = 1
    '문법' = 2
    '말하기' = 3
    '듣기' = 4
    '읽기' = 5
    '쓰기' = 6
    '평가' = 7
    '기타' = 8
    '폴더' = 9
}

$utf8NoBomStrict = New-Object System.Text.UTF8Encoding($false, $true)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$cp949 = [System.Text.Encoding]::GetEncoding(949)
$titleCache = @{}

function Escape-Html {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    return [System.Net.WebUtility]::HtmlEncode($Text)
}

function Read-TextAuto {
    param([string]$Path)

    $bytes = [System.IO.File]::ReadAllBytes($Path)

    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        return (New-Object System.Text.UTF8Encoding($false)).GetString($bytes, 3, $bytes.Length - 3)
    }

    try {
        return $utf8NoBomStrict.GetString($bytes)
    }
    catch {
        return $cp949.GetString($bytes)
    }
}

function Clean-Text {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }

    $t = $Text
    $t = [regex]::Replace($t, '<[^>]+>', ' ')
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = $t -replace '&nbsp;', ' '
    $t = $t -replace '\s+', ' '
    $t = $t.Trim()
    return $t
}

function Get-PageHeadline {
    param([string]$FullPath)

    if ($titleCache.ContainsKey($FullPath)) {
        return $titleCache[$FullPath]
    }

    $text = Read-TextAuto -Path $FullPath

    $title = ''
    $m = [regex]::Match($text, '<title[^>]*>(.*?)</title>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($m.Success) {
        $title = Clean-Text $m.Groups[1].Value
    }

    if ([string]::IsNullOrWhiteSpace($title)) {
        $h = [regex]::Match($text, '<h1[^>]*>(.*?)</h1>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($h.Success) {
            $title = Clean-Text $h.Groups[1].Value
        }
    }

    $title = $title -replace '^\d+\s*과\s*', ''
    $title = $title -replace '^한국어\s*', ''
    $title = $title.Trim(' ', '-', ':', '|')

    if ($title.Length -gt 34) {
        $title = $title.Substring(0, 34).Trim() + '...'
    }

    $titleCache[$FullPath] = $title
    return $title
}

function Normalize-Title {
    param([string]$Slug)
    $value = $Slug -replace '\.[^.]+$',''
    $value = $value -replace '[_-]+',' '
    $value = $value -replace '(?i)([a-z])([0-9])','$1 $2'
    $value = $value -replace '(?i)([0-9])([a-z])','$1 $2'
    $value = $value.Trim()
    if ([string]::IsNullOrWhiteSpace($value)) {
        return '자료'
    }
    return $value
}

function Get-TagOrder {
    param([string]$Tag)
    if ($primaryOrder.ContainsKey($Tag)) {
        return $primaryOrder[$Tag]
    }
    return 90
}

function Get-Tag {
    param([string]$Slug)
    $name = $Slug.ToLowerInvariant()
    switch -Regex ($name) {
        'voca|vocabulary|word' { return '어휘' }
        'gram|grammar' { return '문법' }
        'listen|dictation' { return '듣기' }
        'conv|speak|interview|dialog' { return '말하기' }
        'read|culture' { return '읽기' }
        'write|task|essay|rag|quiz' { return '쓰기' }
        'review|evaluation|test|mock|viewport' { return '평가' }
        default { return '기타' }
    }
}

function Extract-GrammarForm {
    param([string]$Title)

    if ([string]::IsNullOrWhiteSpace($Title)) { return '' }

    $m1 = [regex]::Match($Title, '([A-Z](?:/[A-Z])?-\S{1,24})')
    if ($m1.Success) {
        return $m1.Groups[1].Value
    }

    $m2 = [regex]::Match($Title, '(-\S{1,24})')
    if ($m2.Success) {
        return $m2.Groups[1].Value
    }

    return ''
}

function New-CardHtml {
    param(
        [string]$Href,
        [string]$Title,
        [string]$Tag,
        [string]$Subtitle
    )

    $safeHref = Escape-Html $Href
    $safeTitle = Escape-Html $Title
    $safeTag = Escape-Html $Tag
    $safeSubtitle = Escape-Html $Subtitle

    return @"
<a class="portal-card" href="$safeHref">
  <span class="portal-tag">$safeTag</span>
  <h3 class="portal-card-title">$safeTitle</h3>
  <p class="portal-card-desc">$safeSubtitle</p>
</a>
"@
}

function New-SectionHtml {
    param(
        [string]$Title,
        [string]$Desc,
        [array]$Cards
    )

    $safeTitle = Escape-Html $Title
    $safeDesc = Escape-Html $Desc

    if (-not $Cards -or $Cards.Count -eq 0) {
        $cardsHtml = '<div class="portal-empty">등록된 페이지가 없습니다.</div>'
    }
    else {
        $cardsHtml = "<div class=`"portal-grid`">`n$($Cards -join "`n")`n</div>"
    }

    return @"
<section class="portal-section">
  <div class="portal-section-head">
    <h2 class="portal-section-title">$safeTitle</h2>
    <p class="portal-section-desc">$safeDesc</p>
  </div>
  $cardsHtml
</section>
"@
}

function New-PageHtml {
    param(
        [string]$PageTitle,
        [string]$Subtitle,
        [string]$Kicker,
        [string]$CssHref,
        [string]$BackHref,
        [array]$Sections
    )

    $safePageTitle = Escape-Html $PageTitle
    $safeSubtitle = Escape-Html $Subtitle
    $safeKicker = Escape-Html $Kicker
    $safeCssHref = Escape-Html $CssHref

    if ([string]::IsNullOrWhiteSpace($BackHref)) {
        $topbar = '<span class="portal-topbar-link">한국어 3B 학습 허브</span>'
    }
    else {
        $safeBackHref = Escape-Html $BackHref
        $topbar = "<a class=`"portal-topbar-link`" href=`"$safeBackHref`">← 메인 허브</a>"
    }

    $sectionsHtml = $Sections -join "`n"

    return @"
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$safePageTitle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="$safeCssHref">
</head>
<body>
  <header class="portal-topbar">
    <div class="portal-topbar-inner">
      $topbar
    </div>
  </header>

  <main class="portal-wrap">
    <section class="portal-hero">
      <p class="portal-kicker">$safeKicker</p>
      <h1 class="portal-title">$safePageTitle</h1>
      <p class="portal-subtitle">$safeSubtitle</p>
    </section>

    $sectionsHtml
  </main>
</body>
</html>
"@
}

function New-Entry {
    param(
        [string]$Href,
        [string]$Tag,
        [int]$Slot,
        [int]$Order,
        [string]$Main,
        [string]$Sub
    )

    return [PSCustomObject]@{
        Href = $Href
        Tag = $Tag
        Slot = $Slot
        Order = $Order
        Main = $Main
        Sub = $Sub
    }
}

function Classify-ChapterFile {
    param([string]$Base)

    $n = $Base.ToLowerInvariant()

    if ($n -match '^(vocabulary|voca|vocatch|wordr|word|words)(\d*)$') {
        return [PSCustomObject]@{
            Kind = 'vocab'
            Unit = 1
            Aux = if($Matches[2]){ [int]$Matches[2] } else { 0 }
            Core = $false
            Priority = switch -Regex ($n) {
                '^vocabulary$' { 1 }
                '^voca$' { 2 }
                '^wordr$' { 3 }
                '^vocatch$' { 4 }
                default { 9 }
            }
        }
    }

    if ($n -match '^(gram|grammar)(\d+)(?:[-_](\d+))?$') {
        $digits = $Matches[2]
        $hy = $Matches[3]

        if ($digits.Length -gt 1 -and [int]$digits -gt 4) {
            $unit = [int]$digits.Substring(0,1)
            $aux = [int]$digits.Substring(1)
            $core = $false
        }
        else {
            $unit = [int]$digits
            $aux = if($hy){ [int]$hy } else { 0 }
            $core = ($digits.Length -eq 1 -and -not $hy)
        }

        if ($unit -lt 1 -or $unit -gt 4) {
            $unit = 4
        }

        return [PSCustomObject]@{
            Kind = 'grammar'
            Unit = $unit
            Aux = $aux
            Core = $core
            Priority = 0
        }
    }

    if ($n -match '^(conv|speak|dialog|interview)(\d*)$') {
        $u = if($Matches[2]){ [int]$Matches[2] } else { 1 }
        if ($u -lt 1) { $u = 1 }
        if ($u -gt 2) { $u = 2 }
        return [PSCustomObject]@{
            Kind = 'speaking'
            Unit = $u
            Aux = 0
            Core = $true
            Priority = 0
        }
    }

    if ($n -match '^(listen|dictation)(\d*)$') {
        $u = if($Matches[2]){ [int]$Matches[2] } else { 1 }
        if ($u -lt 1) { $u = 1 }
        if ($u -gt 2) { $u = 2 }
        return [PSCustomObject]@{
            Kind = 'listening'
            Unit = $u
            Aux = 0
            Core = $true
            Priority = 0
        }
    }

    return [PSCustomObject]@{
        Kind = 'other'
        Unit = 99
        Aux = 0
        Core = $false
        Priority = 99
    }
}

function Build-ChapterEntries {
    param(
        [string]$RelDir,
        [array]$Files
    )

    $classified = @()
    foreach ($f in $Files) {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        $meta = Classify-ChapterFile -Base $base
        $full = Join-Path (Join-Path $repoRoot $RelDir) $f.Name
        $topic = Get-PageHeadline -FullPath $full

        $classified += [PSCustomObject]@{
            File = $f
            Base = $base
            Meta = $meta
            Topic = $topic
        }
    }

    $entries = @()

    $vocab = @($classified | Where-Object { $_.Meta.Kind -eq 'vocab' })
    if ($vocab.Count -gt 0) {
        $primary = $vocab | Sort-Object { $_.Meta.Priority }, { $_.Meta.Aux }, Base | Select-Object -First 1
        $entries += New-Entry -Href $primary.File.Name -Tag '어휘' -Slot 1 -Order 0 -Main '어휘카드뒤집기' -Sub ($(if($primary.Topic){$primary.Topic}else{'핵심 어휘 학습'}))

        $others = $vocab | Where-Object { $_.File.Name -ne $primary.File.Name } | Sort-Object { $_.Meta.Aux }, Base
        $i = 1
        foreach ($o in $others) {
            $sub = if($o.Topic){ "연습문제 $i · $($o.Topic)" } else { "연습문제 $i" }
            $entries += New-Entry -Href $o.File.Name -Tag '어휘' -Slot 1 -Order $i -Main "어휘연습문제$i" -Sub $sub
            $i++
        }
    }

    for ($g = 1; $g -le 4; $g++) {
        $group = @($classified | Where-Object { $_.Meta.Kind -eq 'grammar' -and $_.Meta.Unit -eq $g })
        if ($group.Count -eq 0) { continue }

        $primary = $group | Where-Object { $_.Meta.Core } | Select-Object -First 1
        if ($null -eq $primary) {
            $primary = $group | Sort-Object { $_.Meta.Aux }, Base | Select-Object -First 1
        }

        $form = Extract-GrammarForm -Title $primary.Topic
        $primarySub = if($form){ $form } elseif($primary.Topic){ $primary.Topic } else { '설명/예시' }
        $entries += New-Entry -Href $primary.File.Name -Tag '문법' -Slot (1 + $g) -Order 0 -Main "문법$g" -Sub $primarySub

        $others = $group | Where-Object { $_.File.Name -ne $primary.File.Name } | Sort-Object { $_.Meta.Aux }, Base
        $i = 1
        foreach ($o in $others) {
            $formO = Extract-GrammarForm -Title $o.Topic
            $detail = if($formO){ $formO } elseif($o.Topic){ $o.Topic } else { '' }
            $sub = if($detail){ "연습문제 $i · $detail" } else { "연습문제 $i" }
            $entries += New-Entry -Href $o.File.Name -Tag '문법' -Slot (1 + $g) -Order $i -Main "문법$g" -Sub $sub
            $i++
        }
    }

    for ($s = 1; $s -le 2; $s++) {
        $group = @($classified | Where-Object { $_.Meta.Kind -eq 'speaking' -and $_.Meta.Unit -eq $s })
        if ($group.Count -eq 0) { continue }

        $primary = $group | Select-Object -First 1
        $sub = if($primary.Topic){ $primary.Topic } else { '대화/표현 연습' }
        $entries += New-Entry -Href $primary.File.Name -Tag '말하기' -Slot (5 + $s) -Order 0 -Main "말하기$s" -Sub $sub

        $others = $group | Where-Object { $_.File.Name -ne $primary.File.Name } | Sort-Object Base
        $i = 1
        foreach ($o in $others) {
            $subO = if($o.Topic){ "연습문제 $i · $($o.Topic)" } else { "연습문제 $i" }
            $entries += New-Entry -Href $o.File.Name -Tag '말하기' -Slot (5 + $s) -Order $i -Main "말하기$s" -Sub $subO
            $i++
        }
    }

    for ($l = 1; $l -le 2; $l++) {
        $group = @($classified | Where-Object { $_.Meta.Kind -eq 'listening' -and $_.Meta.Unit -eq $l })
        if ($group.Count -eq 0) { continue }

        $primary = $group | Select-Object -First 1
        $sub = if($primary.Topic){ $primary.Topic } else { '듣기 훈련' }
        $entries += New-Entry -Href $primary.File.Name -Tag '듣기' -Slot (7 + $l) -Order 0 -Main "듣기$l" -Sub $sub

        $others = $group | Where-Object { $_.File.Name -ne $primary.File.Name } | Sort-Object Base
        $i = 1
        foreach ($o in $others) {
            $subO = if($o.Topic){ "연습문제 $i · $($o.Topic)" } else { "연습문제 $i" }
            $entries += New-Entry -Href $o.File.Name -Tag '듣기' -Slot (7 + $l) -Order $i -Main "듣기$l" -Sub $subO
            $i++
        }
    }

    $others = @($classified | Where-Object { $_.Meta.Kind -eq 'other' } | Sort-Object Base)
    foreach ($o in $others) {
        $main = Normalize-Title $o.Base
        $sub = if($o.Topic){ $o.Topic } else { '추가 학습 자료' }
        $entries += New-Entry -Href $o.File.Name -Tag '기타' -Slot 99 -Order 0 -Main $main -Sub $sub
    }

    return $entries | Sort-Object Slot, Order, Main
}

function Get-FileCards {
    param([string]$RelDir)

    $fullPath = Join-Path $repoRoot $RelDir
    if (-not (Test-Path $fullPath)) { return @() }

    $files = Get-ChildItem -Path $fullPath -File -Filter *.html |
        Where-Object { $_.Name -ne 'index.html' }

    $isChapter = ($RelDir -match '^c\d+$')
    if ($isChapter) {
        $entries = Build-ChapterEntries -RelDir $RelDir -Files $files
    }
    else {
        $entries = @()
        foreach ($file in $files) {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $tag = Get-Tag $base
            $full = Join-Path $fullPath $file.Name
            $topic = Get-PageHeadline -FullPath $full
            $sub = if($topic){ $topic } else { '학습 페이지 열기' }

            $entries += New-Entry -Href $file.Name -Tag $tag -Slot (Get-TagOrder $tag) -Order 0 -Main (Normalize-Title $base) -Sub $sub
        }

        $entries = $entries | Sort-Object Slot, Main
    }

    $cards = @()
    foreach ($entry in $entries) {
        $cards += New-CardHtml -Href $entry.Href -Title $entry.Main -Tag $entry.Tag -Subtitle $entry.Sub
    }

    return $cards
}

function Get-SubdirCards {
    param([string]$RelDir)

    $fullPath = Join-Path $repoRoot $RelDir
    if (-not (Test-Path $fullPath)) { return @() }

    $dirs = Get-ChildItem -Path $fullPath -Directory | Sort-Object Name
    $cards = @()

    foreach ($dir in $dirs) {
        $indexPath = Join-Path $dir.FullName 'index.html'
        if (Test-Path $indexPath) {
            $href = "$($dir.Name)/index.html"
            $desc = '폴더 허브 열기'
        }
        else {
            $firstHtml = Get-ChildItem -Path $dir.FullName -File -Filter *.html | Sort-Object Name | Select-Object -First 1
            if ($null -eq $firstHtml) { continue }
            $href = "$($dir.Name)/$($firstHtml.Name)"
            $desc = '폴더 첫 페이지 열기'
        }

        $cards += New-CardHtml -Href $href -Title (Normalize-Title $dir.Name) -Tag '폴더' -Subtitle $desc
    }

    return $cards
}

function Write-PortalPage {
    param(
        [string]$RelPath,
        [string]$Title,
        [string]$Subtitle,
        [string]$Kicker,
        [string]$CssHref,
        [string]$BackHref,
        [switch]$AutoSections,
        [array]$ManualSections
    )

    if ($AutoSections) {
        $dir = Split-Path -Parent $RelPath
        $sections = @()

        $subdirCards = Get-SubdirCards -RelDir $dir
        if ($subdirCards.Count -gt 0) {
            $sections += New-SectionHtml -Title '하위 폴더' -Desc '연결된 하위 인덱스' -Cards $subdirCards
        }

        $fileCards = Get-FileCards -RelDir $dir
        $sections += New-SectionHtml -Title '학습 페이지' -Desc '핵심 라벨 + 보조 라벨 구조' -Cards $fileCards
    }
    else {
        $sections = $ManualSections
    }

    $pageHtml = New-PageHtml -PageTitle $Title -Subtitle $Subtitle -Kicker $Kicker -CssHref $CssHref -BackHref $BackHref -Sections $sections
    $targetPath = Join-Path $repoRoot $RelPath
    $targetDir = Split-Path -Parent $targetPath

    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }

    Set-Content -Path $targetPath -Value $pageHtml -Encoding UTF8
}

$rootSections = @(
    New-SectionHtml -Title '챕터 학습' -Desc '과별 학습 페이지' -Cards @(
        (New-CardHtml -Href 'c10/index.html' -Title '10과' -Tag 'Chapter' -Subtitle '10과 자료 모음'),
        (New-CardHtml -Href 'c11/index.html' -Title '11과' -Tag 'Chapter' -Subtitle '11과 자료 모음'),
        (New-CardHtml -Href 'c12/index.html' -Title '12과' -Tag 'Chapter' -Subtitle '12과 자료 모음'),
        (New-CardHtml -Href 'c13/index.html' -Title '13과' -Tag 'Chapter' -Subtitle '13과 자료 모음'),
        (New-CardHtml -Href 'c14/index.html' -Title '14과' -Tag 'Chapter' -Subtitle '14과 자료 모음'),
        (New-CardHtml -Href 'c15/index.html' -Title '15과' -Tag 'Chapter' -Subtitle '15과 자료 모음'),
        (New-CardHtml -Href 'c16/index.html' -Title '16과' -Tag 'Chapter' -Subtitle '16과 자료 모음'),
        (New-CardHtml -Href 'c17/index.html' -Title '17과' -Tag 'Chapter' -Subtitle '17과 자료 모음'),
        (New-CardHtml -Href 'c18/index.html' -Title '18과' -Tag 'Chapter' -Subtitle '준비 중/추가 자료')
    )
    New-SectionHtml -Title '복습 및 평가' -Desc '중간/기말 대비' -Cards @(
        (New-CardHtml -Href 'review4/index.html' -Title 'Review 4' -Tag 'Review' -Subtitle '복습 4 자료'),
        (New-CardHtml -Href 'review5/index.html' -Title 'Review 5' -Tag 'Review' -Subtitle '복습 5 자료'),
        (New-CardHtml -Href 'review6/index.html' -Title 'Review 6' -Tag 'Review' -Subtitle '복습 6 자료'),
        (New-CardHtml -Href 'finalreview/index.html' -Title 'Final Review' -Tag 'Review' -Subtitle '기말 종합 복습')
    )
    New-SectionHtml -Title '보조 학습' -Desc '추가 연습과 수업 도구' -Cards @(
        (New-CardHtml -Href 'ex/index.html' -Title '확장 연습' -Tag 'Supplement' -Subtitle '문법/인터뷰/어휘 확장'),
        (New-CardHtml -Href 'writeclass/index.html' -Title '쓰기 수업' -Tag 'Supplement' -Subtitle '쓰기 활동 자료'),
        (New-CardHtml -Href 'supplement/index.html' -Title '보조 자료' -Tag 'Supplement' -Subtitle '주제별 보조 자료 모음')
    )
)

Write-PortalPage -RelPath 'index.html' -Title '한국어 3B 학습 허브' -Subtitle '챕터 학습, 복습, 보조 자료를 일관된 화면 비율로 탐색할 수 있도록 정리했습니다.' -Kicker 'Korean 3B Hub' -CssHref './assets/portal.css' -BackHref '' -ManualSections $rootSections

$autoTargets = @(
    @{ Rel='c10/index.html'; Title='10과 학습'; Subtitle='10과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 10'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c11/index.html'; Title='11과 학습'; Subtitle='11과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 11'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c12/index.html'; Title='12과 학습'; Subtitle='12과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 12'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c13/index.html'; Title='13과 학습'; Subtitle='13과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 13'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c14/index.html'; Title='14과 학습'; Subtitle='14과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 14'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c15/index.html'; Title='15과 학습'; Subtitle='15과 확장 활동 포함 자료'; Kicker='Chapter 15'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c16/index.html'; Title='16과 학습'; Subtitle='16과 확장 활동 포함 자료'; Kicker='Chapter 16'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c17/index.html'; Title='17과 학습'; Subtitle='17과 어휘, 문법, 대화, 듣기 자료'; Kicker='Chapter 17'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='c18/index.html'; Title='18과 학습'; Subtitle='18과 콘텐츠 준비 현황 및 추가 자료'; Kicker='Chapter 18'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='review4/index.html'; Title='Review 4'; Subtitle='복습 4 관련 학습/평가 자료'; Kicker='Review'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='review5/index.html'; Title='Review 5'; Subtitle='복습 5 관련 학습/평가 자료'; Kicker='Review'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='review6/index.html'; Title='Review 6'; Subtitle='복습 6 관련 학습/평가 자료'; Kicker='Review'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='finalreview/index.html'; Title='Final Review'; Subtitle='기말 종합 복습 자료'; Kicker='Final'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='ex/index.html'; Title='확장 연습'; Subtitle='주제 확장 및 인터뷰/어휘 연습'; Kicker='Extension'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='supplement/index.html'; Title='보조 자료'; Subtitle='도구, 게임, 테스트, 읽기 보충 자료'; Kicker='Supplement'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='writeclass/index.html'; Title='쓰기 수업'; Subtitle='쓰기 과제/연습 중심 자료'; Kicker='Writing Class'; Css='../assets/portal.css'; Back='../index.html' },
    @{ Rel='writeclass/k08/index.html'; Title='쓰기 수업 k08'; Subtitle='k08 쓰기 세부 활동'; Kicker='Writing k08'; Css='../../assets/portal.css'; Back='../index.html' },
    @{ Rel='writeclass/k07/picture/index.html'; Title='쓰기 수업 k07 Picture'; Subtitle='k07 그림 쓰기 활동'; Kicker='Writing k07'; Css='../../../assets/portal.css'; Back='../../index.html' }
)

foreach ($target in $autoTargets) {
    Write-PortalPage -RelPath $target.Rel -Title $target.Title -Subtitle $target.Subtitle -Kicker $target.Kicker -CssHref $target.Css -BackHref $target.Back -AutoSections
}

