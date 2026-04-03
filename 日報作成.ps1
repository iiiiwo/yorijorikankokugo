# ============================================================
# 日報作成ツール
# 使い方: 右クリック → PowerShellで実行
#         または PowerShell で .\日報作成.ps1
# ============================================================
# ※ 実行ポリシーエラーが出た場合は以下を一度実行してください:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# ============================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ============================================================
# ★ タスクテンプレート設定（ここを自由に編集してください）
# ============================================================

# 作業実績テンプレート
# checked: 起動時にチェックが入るか ($true/$false)
# client:  案件名
# desc:    作業内容
# status:  進捗の初期値（"完了" / "40/100" / "" など）
$script:completedTemplates = @(
    [PSCustomObject]@{ checked=$true;  client="長野市"; desc="本番EA資産適用動作確認";          status="完了" }
    [PSCustomObject]@{ checked=$true;  client="長野市"; desc="疑似本番 EQ・EY適用資産動作確認"; status="" }
    [PSCustomObject]@{ checked=$false; client="長野市"; desc="学齢簿運用管理表対応";             status="" }
    [PSCustomObject]@{ checked=$false; client="長野市"; desc="就学援助運用管理表対応";           status="" }
    [PSCustomObject]@{ checked=$true;  client="宝塚市"; desc="住所コード打ち合わせ";             status="完了" }
)

# 翌営業日の作業予定テンプレート
$script:plannedTemplates = @(
    [PSCustomObject]@{ checked=$true;  client="長野市"; desc="疑似本番 EQ・EY適用資産動作確認" }
    [PSCustomObject]@{ checked=$true;  client="長野市"; desc="学齢簿運用管理表対応" }
    [PSCustomObject]@{ checked=$true;  client="長野市"; desc="就学援助運用管理表対応" }
    [PSCustomObject]@{ checked=$false; client="宝塚市"; desc="住所コード打ち合わせ" }
)

# 残業時刻の初期値
$script:defaultOtTime  = "21:30"
$script:defaultOtHours = "0.0"

# ============================================================
# ここから下は変更不要
# ============================================================

function Get-NextWeekdayLabel([datetime]$date) {
    $day    = [int]$date.DayOfWeek   # Sun=0 Mon=1 ... Fri=5 Sat=6
    $labels = @("日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日")
    if ($day -in @(5, 6, 0)) { return "月曜日" }
    return $labels[$day + 1]
}

function Invoke-GenerateReport {
    # 作業実績
    $lines = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt ($script:dgvCompleted.Rows.Count - 1); $i++) {
        $row = $script:dgvCompleted.Rows[$i]
        if ($row.Cells[0].Value -eq $true) {
            $c = "$($row.Cells[1].Value)"
            $d = "$($row.Cells[2].Value)"
            $s = "$($row.Cells[3].Value)"
            if ($c -or $d) {
                $line = "・$c：$d"
                if ($s) { $line += " $s" }
                $lines.Add($line)
            }
        }
    }
    $completedText = if ($lines.Count -gt 0) { $lines -join "`r`n" } else { "（なし）" }

    # 残業
    $otTime  = $script:txtOtTime.Text.Trim()
    $otHours = $script:txtOtHours.Text.Trim()
    if (-not $otTime)  { $otTime  = "なし" }
    if (-not $otHours) { $otHours = "0.0" }

    # 翌営業日の作業予定
    $lines2 = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt ($script:dgvPlanned.Rows.Count - 1); $i++) {
        $row = $script:dgvPlanned.Rows[$i]
        if ($row.Cells[0].Value -eq $true) {
            $c = "$($row.Cells[1].Value)"
            $d = "$($row.Cells[2].Value)"
            if ($c -or $d) { $lines2.Add("・$c：$d") }
        }
    }
    $plannedText = if ($lines2.Count -gt 0) { $lines2 -join "`r`n" } else { "（なし）" }

    $nextDay = Get-NextWeekdayLabel -date $script:dpDate.Value

    $report = @(
        "＜作業実績＞"
        $completedText
        "＜残業予定＞"
        "残業 $otTime　累計${otHours}H"
        ("＜" + $nextDay + "の作業予定＞")
        $plannedText
    ) -join "`r`n"

    $script:txtOutput.Text = $report
}

# ============================================================
# フォーム構築
# ============================================================
$form = New-Object System.Windows.Forms.Form
$form.Text          = "日報作成ツール"
$form.Size          = New-Object System.Drawing.Size(720, 800)
$form.MinimumSize   = New-Object System.Drawing.Size(600, 650)
$form.StartPosition = "CenterScreen"
$form.Font          = New-Object System.Drawing.Font("メイリオ", 9)

$mainPanel = New-Object System.Windows.Forms.Panel
$mainPanel.Dock       = "Fill"
$mainPanel.AutoScroll = $true
$form.Controls.Add($mainPanel)

$y = 12

# ---- 報告日 ----
$lbl = New-Object System.Windows.Forms.Label
$lbl.Text     = "報告日:"
$lbl.Location = New-Object System.Drawing.Point(12, ($y + 4))
$lbl.Size     = New-Object System.Drawing.Size(52, 22)
$mainPanel.Controls.Add($lbl)

$script:dpDate          = New-Object System.Windows.Forms.DateTimePicker
$script:dpDate.Format   = [System.Windows.Forms.DateTimePickerFormat]::Short
$script:dpDate.Value    = [datetime]::Today
$script:dpDate.Location = New-Object System.Drawing.Point(68, $y)
$script:dpDate.Size     = New-Object System.Drawing.Size(130, 26)
$mainPanel.Controls.Add($script:dpDate)

$y += 38

# ---- 区切り ----
function Add-SectionLabel([string]$text) {
    $lbl      = New-Object System.Windows.Forms.Label
    $lbl.Text = $text
    $lbl.Font = New-Object System.Drawing.Font("メイリオ", 10, [System.Drawing.FontStyle]::Bold)
    $lbl.Location = New-Object System.Drawing.Point(12, $y)
    $lbl.Size     = New-Object System.Drawing.Size(400, 24)
    $lbl.ForeColor = [System.Drawing.Color]::FromArgb(30, 100, 160)
    $mainPanel.Controls.Add($lbl)
    $script:y += 28
}

# ============================================================
# ＜作業実績＞
# ============================================================
Add-SectionLabel "＜作業実績＞"

$script:dgvCompleted = New-Object System.Windows.Forms.DataGridView
$script:dgvCompleted.Location = New-Object System.Drawing.Point(12, $y)
$script:dgvCompleted.Size     = New-Object System.Drawing.Size(676, 185)
$script:dgvCompleted.AllowUserToAddRows    = $true
$script:dgvCompleted.AllowUserToDeleteRows = $true
$script:dgvCompleted.RowHeadersVisible     = $false
$script:dgvCompleted.AutoSizeColumnsMode   = "Fill"
$script:dgvCompleted.BackgroundColor       = [System.Drawing.Color]::White
$script:dgvCompleted.BorderStyle           = "FixedSingle"

$col = New-Object System.Windows.Forms.DataGridViewCheckBoxColumn
$col.HeaderText = "✓"; $col.FillWeight = 5
$script:dgvCompleted.Columns.Add($col) | Out-Null

$col = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$col.HeaderText = "案件"; $col.FillWeight = 18
$script:dgvCompleted.Columns.Add($col) | Out-Null

$col = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$col.HeaderText = "作業内容"; $col.FillWeight = 52
$script:dgvCompleted.Columns.Add($col) | Out-Null

$col = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$col.HeaderText = "進捗（完了 / 40/100 等）"; $col.FillWeight = 25
$script:dgvCompleted.Columns.Add($col) | Out-Null

foreach ($t in $script:completedTemplates) {
    $script:dgvCompleted.Rows.Add($t.checked, $t.client, $t.desc, $t.status) | Out-Null
}
$mainPanel.Controls.Add($script:dgvCompleted)
$y += 195

# ============================================================
# ＜残業予定＞
# ============================================================
Add-SectionLabel "＜残業予定＞"

$lbl = New-Object System.Windows.Forms.Label
$lbl.Text     = "残業時刻:"
$lbl.Location = New-Object System.Drawing.Point(12, ($y + 4))
$lbl.Size     = New-Object System.Drawing.Size(64, 22)
$mainPanel.Controls.Add($lbl)

$script:txtOtTime          = New-Object System.Windows.Forms.TextBox
$script:txtOtTime.Text     = $script:defaultOtTime
$script:txtOtTime.Location = New-Object System.Drawing.Point(80, $y)
$script:txtOtTime.Size     = New-Object System.Drawing.Size(80, 26)
$mainPanel.Controls.Add($script:txtOtTime)

$lbl = New-Object System.Windows.Forms.Label
$lbl.Text     = "累計 (H):"
$lbl.Location = New-Object System.Drawing.Point(180, ($y + 4))
$lbl.Size     = New-Object System.Drawing.Size(64, 22)
$mainPanel.Controls.Add($lbl)

$script:txtOtHours          = New-Object System.Windows.Forms.TextBox
$script:txtOtHours.Text     = $script:defaultOtHours
$script:txtOtHours.Location = New-Object System.Drawing.Point(248, $y)
$script:txtOtHours.Size     = New-Object System.Drawing.Size(60, 26)
$mainPanel.Controls.Add($script:txtOtHours)

$y += 44

# ============================================================
# ＜翌営業日の作業予定＞
# ============================================================
Add-SectionLabel "＜翌営業日の作業予定＞"

$script:dgvPlanned = New-Object System.Windows.Forms.DataGridView
$script:dgvPlanned.Location = New-Object System.Drawing.Point(12, $y)
$script:dgvPlanned.Size     = New-Object System.Drawing.Size(676, 160)
$script:dgvPlanned.AllowUserToAddRows    = $true
$script:dgvPlanned.AllowUserToDeleteRows = $true
$script:dgvPlanned.RowHeadersVisible     = $false
$script:dgvPlanned.AutoSizeColumnsMode   = "Fill"
$script:dgvPlanned.BackgroundColor       = [System.Drawing.Color]::White
$script:dgvPlanned.BorderStyle           = "FixedSingle"

$col = New-Object System.Windows.Forms.DataGridViewCheckBoxColumn
$col.HeaderText = "✓"; $col.FillWeight = 5
$script:dgvPlanned.Columns.Add($col) | Out-Null

$col = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$col.HeaderText = "案件"; $col.FillWeight = 22
$script:dgvPlanned.Columns.Add($col) | Out-Null

$col = New-Object System.Windows.Forms.DataGridViewTextBoxColumn
$col.HeaderText = "作業内容"; $col.FillWeight = 73
$script:dgvPlanned.Columns.Add($col) | Out-Null

foreach ($t in $script:plannedTemplates) {
    $script:dgvPlanned.Rows.Add($t.checked, $t.client, $t.desc) | Out-Null
}
$mainPanel.Controls.Add($script:dgvPlanned)
$y += 170

# ============================================================
# ボタン
# ============================================================
$btnGenerate = New-Object System.Windows.Forms.Button
$btnGenerate.Text      = "日報を生成する"
$btnGenerate.Location  = New-Object System.Drawing.Point(12, $y)
$btnGenerate.Size      = New-Object System.Drawing.Size(148, 34)
$btnGenerate.BackColor = [System.Drawing.Color]::SteelBlue
$btnGenerate.ForeColor = [System.Drawing.Color]::White
$btnGenerate.FlatStyle = "Flat"
$btnGenerate.FlatAppearance.BorderSize = 0
$btnGenerate.Font      = New-Object System.Drawing.Font("メイリオ", 9, [System.Drawing.FontStyle]::Bold)
$mainPanel.Controls.Add($btnGenerate)

$btnCopy = New-Object System.Windows.Forms.Button
$btnCopy.Text      = "クリップボードにコピー"
$btnCopy.Location  = New-Object System.Drawing.Point(170, $y)
$btnCopy.Size      = New-Object System.Drawing.Size(180, 34)
$btnCopy.BackColor = [System.Drawing.Color]::SeaGreen
$btnCopy.ForeColor = [System.Drawing.Color]::White
$btnCopy.FlatStyle = "Flat"
$btnCopy.FlatAppearance.BorderSize = 0
$btnCopy.Font      = New-Object System.Drawing.Font("メイリオ", 9, [System.Drawing.FontStyle]::Bold)
$mainPanel.Controls.Add($btnCopy)

$y += 46

# ============================================================
# 出力テキストエリア
# ============================================================
$lbl = New-Object System.Windows.Forms.Label
$lbl.Text     = "生成された日報:"
$lbl.Font     = New-Object System.Drawing.Font("メイリオ", 9, [System.Drawing.FontStyle]::Bold)
$lbl.Location = New-Object System.Drawing.Point(12, $y)
$lbl.Size     = New-Object System.Drawing.Size(200, 22)
$mainPanel.Controls.Add($lbl)
$y += 24

$script:txtOutput            = New-Object System.Windows.Forms.TextBox
$script:txtOutput.Multiline  = $true
$script:txtOutput.ReadOnly   = $true
$script:txtOutput.ScrollBars = "Vertical"
$script:txtOutput.Location   = New-Object System.Drawing.Point(12, $y)
$script:txtOutput.Size       = New-Object System.Drawing.Size(676, 175)
$script:txtOutput.Font       = New-Object System.Drawing.Font("メイリオ", 9)
$script:txtOutput.BackColor  = [System.Drawing.Color]::FromArgb(245, 247, 250)
$mainPanel.Controls.Add($script:txtOutput)

$y += 185
$mainPanel.AutoScrollMinSize = New-Object System.Drawing.Size(0, ($y + 10))

# ============================================================
# イベント
# ============================================================
$btnGenerate.Add_Click({ Invoke-GenerateReport })

$btnCopy.Add_Click({
    if ($script:txtOutput.Text) {
        [System.Windows.Forms.Clipboard]::SetText($script:txtOutput.Text)
        $btnCopy.Text = "コピーしました ✓"
        $t = New-Object System.Windows.Forms.Timer
        $t.Interval = 2000
        $t.Add_Tick({
            $btnCopy.Text = "クリップボードにコピー"
            $t.Stop(); $t.Dispose()
        })
        $t.Start()
    }
})

# 起動時に自動生成
$form.Add_Shown({ Invoke-GenerateReport })

[void]$form.ShowDialog()
