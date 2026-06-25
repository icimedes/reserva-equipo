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
    tbody.textContent = "";
    data.forEach(r => {
      const tr = document.createElement("tr");

      const tdEquipo = document.createElement("td");
      tdEquipo.textContent = r.equipo_nombre || "-";

      const tdNombre = document.createElement("td");
      tdNombre.textContent = r.nombre_completo || "-";

      const tdProyecto = document.createElement("td");
      tdProyecto.textContent = r.nombre_proyecto || "-";

      const tdFecha = document.createElement("td");
      tdFecha.textContent = formatFecha(r.fecha_reserva);

      const tdHora = document.createElement("td");
      tdHora.textContent = formatHora(r.hora_inicio) + " - " + formatHora(r.hora_fin);

      const tdEstado = document.createElement("td");
      const spanEstado = document.createElement("span");
      spanEstado.className = "tag-estado " + r.estado;
      spanEstado.textContent = r.estado;
      tdEstado.appendChild(spanEstado);

      tr.appendChild(tdEquipo);
      tr.appendChild(tdNombre);
      tr.appendChild(tdProyecto);
      tr.appendChild(tdFecha);
      tr.appendChild(tdHora);
      tr.appendChild(tdEstado);

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
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_reservas_${getEl("reportDesde").value}_${getEl("reportHasta").value}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function buildReportHTML(data, desdeLabel, hastaLabel){
    const total = data.length;
    const aprobadas = countByStatus(data, "aprobada");
    const pendientes = countByStatus(data, "pendiente");
    const rechazadas = countByStatus(data, "rechazada");

    const hourlyCanvas = getEl("chartHourly");
    const weeklyCanvas = getEl("chartWeekly");
    const hourlyImg = hourlyCanvas ? '<img src="' + hourlyCanvas.toDataURL("image/png") + '" style="width:100%;" />' : "";
    const weeklyImg = weeklyCanvas ? '<img src="' + weeklyCanvas.toDataURL("image/png") + '" style="width:100%;" />' : "";

    const rows = data.map(r => `
      <tr>
        <td>${r.equipo_nombre || "-"}</td>
        <td>${r.nombre_completo || "-"}</td>
        <td>${r.nombre_proyecto || "-"}</td>
        <td>${formatFecha(r.fecha_reserva)}</td>
        <td>${formatHora(r.hora_inicio)} - ${formatHora(r.hora_fin)}</td>
        <td><span class="st-${r.estado}">${r.estado}</span></td>
      </tr>
    `).join("");

    const now = new Date();
    const fechaGen = now.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaGen = now.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });

    return `
<div style="font-family:'Manrope','Segoe UI',Arial,sans-serif;color:#0b1220;max-width:100%;padding:10px;">

  <div style="border-bottom:3px solid #002a5c;padding-bottom:12px;margin-bottom:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>
        <h1 style="font-family:'DM Serif Display',serif;font-size:22px;margin:0;color:#002a5c;">ICIMEDES</h1>
        <p style="margin:4px 0 0 0;font-size:12px;color:#5b667a;">Instituto de Investigacion en Ciencias Medicas y Derecho a la Salud</p>
      </div>
      <div style="text-align:right;font-size:11px;color:#5b667a;">
        <p style="margin:0;">Generado: ${fechaGen} ${horaGen}</p>
      </div>
    </div>
    <h2 style="font-family:'DM Serif Display',serif;font-size:16px;margin:14px 0 4px 0;color:#0b1220;">Reporte de Reservas</h2>
    <p style="margin:0;font-size:12px;color:#5b667a;">Periodo: ${desdeLabel || "—"} al ${hastaLabel || "—"} · ${total} reservas</p>
  </div>

  <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
    <div style="flex:1;min-width:100px;background:#fff;border:1px solid #e4e9f4;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#0b1220;">${total}</div>
      <div style="font-size:10px;color:#5b667a;font-weight:700;margin-top:2px;">TOTAL</div>
    </div>
    <div style="flex:1;min-width:100px;background:#fff;border:1px solid #e4e9f4;border-left:4px solid #0f7b3a;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#0f7b3a;">${aprobadas}</div>
      <div style="font-size:10px;color:#5b667a;font-weight:700;margin-top:2px;">APROBADAS</div>
    </div>
    <div style="flex:1;min-width:100px;background:#fff;border:1px solid #e4e9f4;border-left:4px solid #b88400;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#b88400;">${pendientes}</div>
      <div style="font-size:10px;color:#5b667a;font-weight:700;margin-top:2px;">PENDIENTES</div>
    </div>
    <div style="flex:1;min-width:100px;background:#fff;border:1px solid #e4e9f4;border-left:4px solid #b42318;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#b42318;">${rechazadas}</div>
      <div style="font-size:10px;color:#5b667a;font-weight:700;margin-top:2px;">RECHAZADAS</div>
    </div>
  </div>

  <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
    <div style="flex:1;min-width:260px;background:#fff;border:1px solid #e4e9f4;border-radius:8px;padding:10px;">
      <h3 style="font-size:12px;font-weight:700;margin:0 0 8px 0;color:#0b1220;">Reservas por hora del dia</h3>
      ${hourlyImg}
    </div>
    <div style="flex:1;min-width:260px;background:#fff;border:1px solid #e4e9f4;border-radius:8px;padding:10px;">
      <h3 style="font-size:12px;font-weight:700;margin:0 0 8px 0;color:#0b1220;">Reservas por dia de la semana</h3>
      ${weeklyImg}
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:10px;">
    <thead>
      <tr style="background:#f0f3fa;">
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Equipo</th>
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Solicitante</th>
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Proyecto</th>
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Fecha</th>
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Hora</th>
        <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e9f4;font-weight:700;color:#002a5c;">Estado</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <style>
    .st-aprobada{display:inline-block;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;background:rgba(15,123,58,.12);color:#0f7b3a;}
    .st-pendiente{display:inline-block;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;background:rgba(184,132,0,.12);color:#7b5a00;}
    .st-rechazada{display:inline-block;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;background:rgba(180,35,24,.12);color:#b42318;}
    table tbody tr:nth-child(even){background:#f8f9fc;}
  </style>

</div>`;
  }

  function exportPDF(){
    if (typeof html2pdf === "undefined"){
      alert("Libreria PDF no cargada. Recarga la pagina.");
      return;
    }

    const desde = getEl("reportDesde").value;
    const hasta = getEl("reportHasta").value;
    const filtered = filterByDateRange(cachedData, desde, hasta);

    if (filtered.length === 0){
      alert("No hay datos para exportar en el rango seleccionado.");
      return;
    }

    const desdeLabel = desde ? formatFecha(desde) : "—";
    const hastaLabel = hasta ? formatFecha(hasta) : "—";
    const reportHTML = buildReportHTML(filtered, desdeLabel, hastaLabel);

    const container = document.createElement("div");
    container.style.cssText = "position:absolute;left:-9999px;top:0;width:1000px;z-index:-1;";
    container.innerHTML = reportHTML;
    document.body.appendChild(container);

    html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `reporte_reservas_${desde || "todo"}_${hasta || "todo"}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      })
      .from(container)
      .save()
      .then(() => {
        if (container.parentNode) container.parentNode.removeChild(container);
      })
      .catch(err => {
        if (container.parentNode) container.parentNode.removeChild(container);
        console.error("Error al exportar PDF:", err);
        alert("Error al generar PDF. Intenta con CSV.");
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    getEl("btnFiltrarReportes").addEventListener("click", refreshDashboard);
    getEl("btnExportCSV").addEventListener("click", exportCSV);
    getEl("btnExportPDF").addEventListener("click", exportPDF);
  });

  window.initReports = initReports;
})();