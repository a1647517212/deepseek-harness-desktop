if (window.desktop) {
  window.desktop.getInfo().then((info) => {
    document.getElementById('app-version').textContent = info.appVersion
    document.getElementById('dsh-version').textContent = info.dshVersion
  }).catch(() => {})
}
