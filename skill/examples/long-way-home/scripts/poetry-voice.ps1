param(
  [Parameter(Mandatory = $true)][string]$LinesFile,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Voice
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force $OutDir | Out-Null
$lines = @(Get-Content -Raw -Encoding UTF8 $LinesFile) -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }
if ($lines.Count -eq 0) { throw 'No recitation lines.' }

$probe = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $installed = @($probe.GetInstalledVoices() | Where-Object { $_.Enabled })
  $chosen = $null
  if ($Voice) {
    $chosen = $installed | Where-Object { $_.VoiceInfo.Name -eq $Voice } | Select-Object -First 1
  }
  if (-not $chosen) {
    $chosen = $installed | Where-Object { $_.VoiceInfo.Culture.Name -like 'zh*' } | Select-Object -First 1
  }
  if (-not $chosen) {
    throw 'No Chinese speech voice installed. Install a zh-CN voice or provide a recorded recitation.'
  }
  $chosenName = $chosen.VoiceInfo.Name
} finally {
  $probe.Dispose()
}

for ($i = 0; $i -lt $lines.Count; $i++) {
  $text = $lines[$i].Trim().TrimStart([char]0xFEFF)
  $safe = [System.Security.SecurityElement]::Escape($text)
  $rate = if ($i -eq 0) { '-10%' } elseif ($i -eq $lines.Count - 1) { '-15%' } else { '-8%' }
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><prosody rate='$rate' pitch='-2st'>$safe<break time='450ms'/></prosody></speak>"
  $file = Join-Path $OutDir ("line-{0:D2}.wav" -f ($i + 1))
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $synth.SelectVoice($chosenName)
    $synth.Rate = -1
    $synth.Volume = 92
    $synth.SetOutputToWaveFile($file)
    $synth.SpeakSsml($ssml)
  } finally {
    $synth.Dispose()
  }
}
Write-Output ("voice=" + $chosenName)
