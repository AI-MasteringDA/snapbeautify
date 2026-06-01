// Fetch the latest release from GitHub and point the download buttons directly
// at the .exe asset. Falls back gracefully if there's no release yet.
(function () {
  const REPO = 'AI-MasteringDA/snapbeautify';
  const fallbackUrl = `https://github.com/${REPO}/releases/latest`;

  fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    .then((r) => (r.ok ? r.json() : null))
    .then((release) => {
      if (!release || !release.assets) return;
      const exe = release.assets.find((a) => /\.exe$/i.test(a.name));
      if (!exe) return;

      const btn1 = document.getElementById('download-btn');
      const btn2 = document.getElementById('download-btn-2');
      const label = document.getElementById('download-label');
      const versionLine = document.getElementById('version-line');

      if (btn1) btn1.href = exe.browser_download_url;
      if (btn2) btn2.href = exe.browser_download_url;
      if (label) label.textContent = `Download for Windows · ${release.tag_name}`;
      if (versionLine) {
        const sizeMB = (exe.size / (1024 * 1024)).toFixed(0);
        versionLine.textContent = `Windows 10/11 · ~${sizeMB} MB · ${release.tag_name} · Updates automatically`;
      }
    })
    .catch(() => {
      // network error / API rate limit — keep fallback /releases/latest link
    });
})();
