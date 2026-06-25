(function(){
  const DIAS = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];
  let chartHourly = null;
  let chartWeekly = null;
  let cachedData = [];
  let cachedToken = null;

  function getEl(id){ return document.getElementById(id); }

  function formatFecha(isoDate){
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatHora(t){
    if (!t) return "";
    return t.slice(0, 5);
  }

  function getTodayISO(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function get30DaysAgoISO(){
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getDateFromISO(iso){
    if (!iso) return null;
    const parts = iso.split("-");
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  function getDayName(iso){
    const d = getDateFromISO(iso);
    if (!d) return "";
    return DIAS[d.getDay()];
  }

  function getHourFromTime(t){
    if (!t) return -1;
    const parts = t.split(":");
    return parseInt(parts[0], 10);
  }

  function filterByDateRange(data, desde, hasta){
    if (!desde && !hasta) return data;
    const d = desde ? getDateFromISO(desde) : null;
    const h = hasta ? getDateFromISO(hasta) : null;
    return data.filter(r => {
      const rd = getDateFromISO(r.fecha_reserva);
      if (!rd) return true;
      if (d && rd < d) return false;
      if (h) {
        const hEnd = new Date(h);
        hEnd.setDate(hEnd.getDate() + 1);
        if (rd >= hEnd) return false;
      }
      return true;
    });
  }

  function aggregateByHour(data){
    const counts = {};
    for (let h = 7; h <= 18; h++) counts[h] = 0;
    data.forEach(r => {
      const h = getHourFromTime(r.hora_inicio);
      if (h >= 7 && h <= 18) counts[h]++;
    });
    return counts;
  }

  function aggregateByDay(data){
    const counts = {};
    DIAS.forEach((_, i) => counts[i] = 0);
    data.forEach(r => {
      const d = getDateFromISO(r.fecha_reserva);
      if (d) counts[d.getDay()]++;
    });
    return counts;
  }

  function countByStatus(data, estado){
    return data.filter(r => r.estado === estado).length;
  }

  function renderKPIs(data){
    const total = data.length;
    const aprobadas = countByStatus(data, "aprobada");
    const pendientes = countByStatus(data, "pendiente");
    const rechazadas = countByStatus(data, "rechazada");
    getEl("kpiTotal").textContent = total;
    getEl("kpiAprobadas").textContent = aprobadas;
    getEl("kpiPendientes").textContent = pendientes;
    getEl("kpiRechazadas").textContent = rechazadas;
  }

  function renderHourlyChart(data){
    const ctx = getEl("chartHourly").getContext("2d");
    if (chartHourly) chartHourly.destroy();
    const agg = aggregateByHour(data);
    const labels = Object.keys(agg).map(h => `${String(h).padStart(2,"0")}:00`);
    const values = Object.values(agg);
    chartHourly = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Reservas",
          data: values,
          backgroundColor: "rgba(21,101,192,.65)",
          borderColor: "rgba(21,101,192,1)",
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,.06)" }
          },
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderWeeklyChart(data){
    const ctx = getEl("chartWeekly").getContext("2d");
    if (chartWeekly) chartWeekly.destroy();
    const agg = aggregateByDay(data);
    const labels = DIAS;
    const values = DIAS.map((_, i) => agg[i]);
    chartWeekly = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Reservas",
          data: values,
          backgroundColor: "rgba(15,123,58,.65)",
          borderColor: "rgba(15,123,58,1)",
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,.06)" }
          },
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderTable(data){
    const tbody = document.querySelector("#reportsTable tbody");
    tbody.innerHTML = "";
    data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.equipo_nombre || "-"}</td>
        <td>${r.nombre_completo || "-"}</td>
        <td>${r.nombre_proyecto || "-"}</td>
        <td>${formatFecha(r.fecha_reserva)}</td>
        <td>${formatHora(r.hora_inicio)} - ${formatHora(r.hora_fin)}</td>
        <td><span class="tag-estado ${r.estado}">${r.estado}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function refreshDashboard(){
    const desde = getEl("reportDesde").value;
    const hasta = getEl("reportHasta").value;
    const filtered = filterByDateRange(cachedData, desde, hasta);
    renderKPIs(filtered);
    renderHourlyChart(filtered);
    renderWeeklyChart(filtered);
    renderTable(filtered);
  }

  async function loadData(token){
    const { data, error } = await window.supabaseClient
      .rpc("admin_get_reservas", { p_token: token });
    if (error){
      console.error("Error al cargar datos de reportes:", error);
      return [];
    }
    return data || [];
  }

  function setDefaultDates(){
    if (!getEl("reportDesde").value) getEl("reportDesde").value = get30DaysAgoISO();
    if (!getEl("reportHasta").value) getEl("reportHasta").value = getTodayISO();
  }

  async function initReports(token){
    if (!token) return;
    if (cachedToken !== token || cachedData.length === 0){
      cachedToken = token;
      cachedData = await loadData(token);
    }
    setDefaultDates();
    refreshDashboard();
  }

  function exportCSV(){
    const desde = getEl("reportDesde").value;
    const hasta = getEl("reportHasta").value;
    const filtered = filterByDateRange(cachedData, desde, hasta);
    if (filtered.length === 0){
      alert("No hay datos para exportar en el rango seleccionado.");
      return;
    }
    const headers = ["Equipo","Solicitante","Proyecto","Registro","Fecha","Hora Inicio","Hora Fin","Estado"];
    const rows = filtered.map(r => [
      r.equipo_nombre || "",
      r.nombre_completo || "",
      r.nombre_proyecto || "",
      r.num_registro_proyecto || "",
      r.fecha_reserva || "",
      formatHora(r.hora_inicio),
      formatHora(r.hora_fin),
      r.estado || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_reservas_${getEl("reportDesde").value}_${getEl("reportHasta").value}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function exportPDF(){
    const element = getEl("reportsPanel").querySelector(".bd");
    if (!element) return;
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `reporte_reservas_${getEl("reportDesde").value}_${getEl("reportHasta").value}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(element).save();
  }

  document.addEventListener("DOMContentLoaded", () => {
    getEl("btnFiltrarReportes").addEventListener("click", refreshDashboard);
    getEl("btnExportCSV").addEventListener("click", exportCSV);
    getEl("btnExportPDF").addEventListener("click", exportPDF);
  });

  window.initReports = initReports;
})();