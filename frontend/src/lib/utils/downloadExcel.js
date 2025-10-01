export async function downloadExcel(endpoint = '/api/export/excel', params = {}, fallbackFilename = 'reporte.xlsx') {
  // filtrar params vacíos/indefinidos para evitar enviar 'undefined' en la URL
  const filteredEntries = Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '');
  const qs = new URLSearchParams(Object.fromEntries(filteredEntries)).toString();
  const url = `${endpoint}?${qs}`;
  const token = localStorage.getItem('token');

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  // intentar sacar filename de headers, si viene
  const disposition = res.headers.get('content-disposition');
  let filename = fallbackFilename;
  if (disposition) {
    const m = disposition.match(/filename="?([^"]+)"?/);
    if (m) filename = m[1];
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
