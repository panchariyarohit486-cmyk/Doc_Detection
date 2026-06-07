(() => {
  // grab all the elements we need up front
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const browseBtn      = document.getElementById('browseBtn');
  const confSlider     = document.getElementById('confSlider');
  const confVal        = document.getElementById('confVal');
  const detectBtn      = document.getElementById('detectBtn');
  const overlay        = document.getElementById('overlay');
  const resultsSection = document.getElementById('resultsSection');
  const statsBar       = document.getElementById('statsBar');
  const inputPreview   = document.getElementById('inputPreview');
  const outputPreview  = document.getElementById('outputPreview');
  const detectionBody  = document.getElementById('detectionBody');
  const downloadBtn    = document.getElementById('downloadBtn');
  const toast          = document.getElementById('toast');

  let selectedFile  = null;
  let lastOutputUrl = null;

  // tab switching
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const view = link.dataset.view;
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => {
        v.hidden = (v.id !== `view-${view}`);
      });
      link.classList.add('active');
      if (view === 'model') loadModelInfo();
    });
  });

  // confidence slider
  confSlider.addEventListener('input', () => {
    confVal.textContent = `${confSlider.value}%`;
  });

  // open file picker
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', e => {
    if (e.target !== browseBtn) fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  // drag & drop
  ['dragenter', 'dragover'].forEach(evt =>
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    })
  );
  dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  function setFile(file) {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'];
    if (!allowed.includes(file.type)) {
      showToast('Unsupported file type. Use PNG, JPG, WEBP, or BMP.', 'error');
      return;
    }
    selectedFile = file;

    // show a preview inside the drop zone
    const reader = new FileReader();
    reader.onload = ev => { inputPreview.src = ev.target.result; };
    reader.readAsDataURL(file);

    dropZone.querySelector('.upload-label').textContent = file.name;
    dropZone.querySelector('.upload-sub').textContent =
      `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    detectBtn.disabled = false;
  }

  // run inference
  detectBtn.addEventListener('click', runDetection);

  async function runDetection() {
    if (!selectedFile) return;

    showOverlay(true);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('confidence', confSlider.value / 100);

    try {
      const res  = await fetch('/detect', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Detection failed.');
      }

      renderResults(data);
      showToast(`${data.total} object(s) detected ✓`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      showOverlay(false);
    }
  }

  const CLASS_COLORS = ['cls-0', 'cls-1', 'cls-2', 'cls-3', 'cls-4'];

  function renderResults(data) {
    // summary pills at the top
    const pills = [
      `<div class="stat-pill accent"><strong>${data.total}</strong> detections</div>`,
      ...Object.entries(data.summary).map(([cls, cnt]) =>
        `<div class="stat-pill"><strong>${cnt}</strong> × ${cls}</div>`
      )
    ].join('');
    statsBar.innerHTML = pills;

    // annotated image — cache-bust so stale results don't show
    lastOutputUrl = `/static/outputs/${data.output_image}`;
    outputPreview.src = lastOutputUrl + '?t=' + Date.now();

    // fill in the table
    detectionBody.innerHTML = data.detections.map((d, i) => {
      const colorCls = CLASS_COLORS[i % CLASS_COLORS.length];
      const barW     = Math.round(d.confidence);
      return `
        <tr>
          <td style="color:var(--muted)">${i + 1}</td>
          <td><span class="cls-tag ${colorCls}">${d.class}</span></td>
          <td>
            <div class="conf-bar">
              <div class="conf-fill" style="width:${barW}px"></div>
              <span>${d.confidence}%</span>
            </div>
          </td>
          <td style="color:var(--muted)">[${d.box.join(', ')}]</td>
          <td>${d.width} × ${d.height}</td>
        </tr>`;
    }).join('');

    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // download the annotated image
  downloadBtn.addEventListener('click', () => {
    if (!lastOutputUrl) return;
    const a = document.createElement('a');
    a.href     = lastOutputUrl;
    a.download = 'docdetect_result.jpg';
    a.click();
  });

  // fetch class names from the backend, only once
  let modelLoaded = false;
  async function loadModelInfo() {
    if (modelLoaded) return;
    try {
      const res  = await fetch('/model-info');
      const data = await res.json();
      const chips = Object.values(data.classes)
        .map((cls, i) => `<span class="chip cls-${i % 5}">${cls}</span>`)
        .join('');
      document.getElementById('classList').innerHTML =
        chips || '<span class="chip">No classes found</span>';
      modelLoaded = true;
    } catch {
      document.getElementById('classList').innerHTML =
        '<span class="chip">Unavailable</span>';
    }
  }

  function showOverlay(show) {
    overlay.hidden = !show;
  }

  let toastTimer;
  function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className   = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

})();