function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusClass(status) {
  return String(status).toLowerCase().replace(/\s+/g, '');
}

function severityClass(severity) {
  return String(severity).toLowerCase();
}

async function loadDashboard() {
  const res = await fetch('/api/admin/reports');
  if (res.status === 401) {
    window.location.href = '/admin-login.html';
    return;
  }

  const reports = await res.json();
  renderMetrics(reports);
  renderBreakdown(reports);
  renderTable(reports);
}

function renderMetrics(reports) {
  const total = reports.length;
  const critical = reports.filter(r => String(r.severity).toLowerCase() === 'critical').length;
  const high = reports.filter(r => String(r.severity).toLowerCase() === 'high').length;
  const resolved = reports.filter(r => String(r.status).toLowerCase() === 'resolved').length;

  document.getElementById('metricCards').innerHTML = `
    <article class="metric-card">
      <span class="metric-label">Total Reports</span>
      <strong>${total}</strong>
      <span>All incidents submitted so far</span>
    </article>
    <article class="metric-card">
      <span class="metric-label">Critical Reports</span>
      <strong>${critical}</strong>
      <span>Highest-priority cases</span>
    </article>
    <article class="metric-card">
      <span class="metric-label">High Severity</span>
      <strong>${high}</strong>
      <span>Needs quick review</span>
    </article>
    <article class="metric-card">
      <span class="metric-label">Resolved</span>
      <strong>${resolved}</strong>
      <span>Cases already handled</span>
    </article>
  `;
}

function renderBreakdown(reports) {
  const counts = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});

  const statuses = ['New', 'In Review', 'Resolved'];
  document.getElementById('statusBreakdown').innerHTML = statuses
    .map(status => `<span class="status-pill">${status}: <strong>${counts[status] || 0}</strong></span>`)
    .join('');
}

function renderTable(reports) {
  const body = document.getElementById('reportsTableBody');
  if (!reports.length) {
    body.innerHTML = '<tr><td colspan="7">No reports submitted yet.</td></tr>';
    return;
  }

  body.innerHTML = reports.map(report => `
    <tr>
      <td>#${report.id}</td>
      <td>
        <strong>${escapeHtml(report.full_name)}</strong><br />
        <span class="muted">${escapeHtml(report.email)}</span>
      </td>
      <td>${escapeHtml(report.incident_type)}</td>
      <td><span class="severity-badge severity-${severityClass(report.severity)}">${escapeHtml(report.severity)}</span></td>
      <td>${escapeHtml(report.description)}</td>
      <td>${new Date(report.created_at).toLocaleString()}</td>
      <td>
        <select class="admin-select" data-id="${report.id}">
          <option value="New" ${report.status === 'New' ? 'selected' : ''}>New</option>
          <option value="In Review" ${report.status === 'In Review' ? 'selected' : ''}>In Review</option>
          <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('.admin-select').forEach(select => {
    select.addEventListener('change', async () => {
      const id = select.dataset.id;
      const status = select.value;
      await fetch(`/api/admin/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await loadDashboard();
    });
  });
}

document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
loadDashboard();
