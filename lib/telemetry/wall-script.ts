// Builds the Windows (PowerShell) script that opens the chosen telemetry windows as app windows, puts each one on the
// chosen monitor/slot and strips the title bar and borders (like the MultiViewer windows). The script reads the real
// monitors itself, so the launcher only says "monitor 3, left half".

export interface WallItem { id: string; path: string; screen: number; slot: string }

export function wallScript(items: WallItem[], base: string): string {
  const ps = (s: string) => `'${s.replace(/'/g, "''")}'`
  const list = items.map(i => `  @{ id = ${ps(i.id)}; path = ${ps(i.path)}; screen = ${Math.max(1, Math.floor(i.screen) || 1)}; slot = ${ps(i.slot)} }`).join('\n')
  return `# Beira F1 - janelas de telemetria sem bordas.
# Uso: botao direito neste ficheiro > "Executar com o PowerShell".
#   -Ecras   mostra os ecras que o Windows ve (numerados da esquerda para a direita)
#   -Fechar  fecha todas as janelas abertas por este script
param([switch]$Fechar, [switch]$Ecras, [string]$Base = ${ps(base)})
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class F1W {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern int SetWindowLong(IntPtr h, int i, int v);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int w, int ht, uint f);
  public static IntPtr Find(string prefix) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => {
      if (!IsWindowVisible(h)) return true;
      StringBuilder sb = new StringBuilder(300);
      GetWindowText(h, sb, 300);
      if (sb.ToString().StartsWith(prefix)) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static void Borderless(IntPtr h, int x, int y, int w, int ht) {
    int st = GetWindowLong(h, -16);
    st &= ~(0x00C00000 | 0x00040000 | 0x00080000 | 0x00020000 | 0x00010000);
    SetWindowLong(h, -16, st);
    int ex = GetWindowLong(h, -20);
    ex &= ~(0x00000001 | 0x00000100 | 0x00020000 | 0x00000200);
    SetWindowLong(h, -20, ex);
    SetWindowPos(h, IntPtr.Zero, x, y, w, ht, 0x0020 | 0x0004 | 0x0040);
  }
}
"@
[void][F1W]::SetProcessDPIAware()

$profileDir = Join-Path $env:LOCALAPPDATA 'BeiraF1Wall'
function Close-Wall {
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*BeiraF1Wall*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
if ($Fechar) { Close-Wall; Write-Host 'Janelas fechadas.'; exit }

$screens = @([System.Windows.Forms.Screen]::AllScreens | Sort-Object { $_.Bounds.X }, { $_.Bounds.Y })
if ($Ecras) {
  $n = 1
  foreach ($s in $screens) { Write-Host ('Ecra {0}: {1}x{2} em ({3},{4}){5}' -f $n, $s.Bounds.Width, $s.Bounds.Height, $s.Bounds.X, $s.Bounds.Y, $(if ($s.Primary) { ' [principal]' } else { '' })); $n++ }
  exit
}

$wins = @(
${list}
)

function Get-Slot($b, $slot) {
  $x = $b.X; $y = $b.Y; $w = $b.Width; $h = $b.Height
  $hw = [int][Math]::Floor($w / 2); $hh = [int][Math]::Floor($h / 2)
  switch ($slot) {
    'left'   { return @($x, $y, $hw, $h) }
    'right'  { return @(($x + $hw), $y, ($w - $hw), $h) }
    'top'    { return @($x, $y, $w, $hh) }
    'bottom' { return @($x, ($y + $hh), $w, ($h - $hh)) }
    'tl'     { return @($x, $y, $hw, $hh) }
    'tr'     { return @(($x + $hw), $y, ($w - $hw), $hh) }
    'bl'     { return @($x, ($y + $hh), $hw, ($h - $hh)) }
    'br'     { return @(($x + $hw), ($y + $hh), ($w - $hw), ($h - $hh)) }
    default  { return @($x, $y, $w, $h) }
  }
}

$cands = @(
  "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
  "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe",
  "$env:LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe",
  "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe",
  "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"
)
$browser = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Nao encontrei o Chrome nem o Edge.' }

Close-Wall
Start-Sleep -Milliseconds 800
$flags = @("--user-data-dir=$profileDir", '--no-first-run', '--no-default-browser-check', '--disable-features=CalculateNativeWinOcclusion', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows')

$geo = @{}
foreach ($w in $wins) {
  $idx = [Math]::Min([Math]::Max($w.screen, 1), $screens.Count) - 1
  $g = Get-Slot $screens[$idx].Bounds $w.slot
  $geo[$w.id] = $g
  Start-Process $browser -ArgumentList ($flags + @("--app=$Base$($w.path)", "--window-position=$($g[0]),$($g[1])", "--window-size=$($g[2]),$($g[3])"))
  Start-Sleep -Milliseconds 600
}

$missing = @()
foreach ($w in $wins) {
  $h = [IntPtr]::Zero
  for ($t = 0; $t -lt 50 -and $h -eq [IntPtr]::Zero; $t++) {
    $h = [F1W]::Find("F1W-$($w.id)|")
    if ($h -eq [IntPtr]::Zero) { Start-Sleep -Milliseconds 400 }
  }
  if ($h -eq [IntPtr]::Zero) { $missing += $w.id; continue }
  $g = $geo[$w.id]
  [F1W]::Borderless($h, $g[0], $g[1], $g[2], $g[3])
  Start-Sleep -Milliseconds 350
  [F1W]::Borderless($h, $g[0], $g[1], $g[2], $g[3])
}
if ($missing.Count -gt 0) {
  Write-Host ('Nao apanhei estas janelas: ' + ($missing -join ', '))
  Write-Host 'Se pedem login: entra com a tua conta de admin numa delas (so a primeira vez) e volta a executar o script.'
} else {
  Write-Host ('Prontas: ' + $wins.Count + ' janelas. Para fechar tudo: executa com -Fechar.')
}
`
}
