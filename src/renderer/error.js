const byId = (id) => document.getElementById(id)

function render(info) {
  byId('error').textContent = info.error || 'Unknown error'
  byId('tail').textContent = info.harnessLogTail || '(no harness log output)'
  byId('meta').textContent =
    'Desktop v' + info.appVersion + ' · embedded harness v' + info.dshVersion +
    ' · engine log: ' + info.harnessLogPath + ' · DSH_HOME: ' + info.dshHome
}

if (window.desktop) {
  window.desktop.getInfo().then(render).catch(() => {})
  byId('restart').addEventListener('click', () => {
    byId('restart').disabled = true
    byId('error').textContent = 'Restarting the engine…'
    window.desktop.restartHarness().catch(() => {})
  })
  byId('quit').addEventListener('click', () => { window.desktop.quit() })
} else {
  byId('error').textContent = 'Desktop bridge unavailable.'
}
