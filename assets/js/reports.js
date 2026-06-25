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
    if (chartHourly) chartHourly.resize();
    if (chartWeekly) chartWeekly.resize();
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

  function exportPDF(){
    const desde = getEl("reportDesde").value;
    const hasta = getEl("reportHasta").value;
    const filtered = filterByDateRange(cachedData, desde, hasta);

    if (filtered.length === 0){
      alert("No hay datos para exportar en el rango seleccionado.");
      return;
    }

    if (typeof window.jspdf === "undefined" || typeof window.jspdf.jsPDF === "undefined"){
      alert("Libreria PDF no cargada. Recarga la pagina.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const left = 14;

    const total = filtered.length;
    const aprobadas = countByStatus(filtered, "aprobada");
    const pendientes = countByStatus(filtered, "pendiente");
    const rechazadas = countByStatus(filtered, "rechazada");
    const desdeLabel = desde ? formatFecha(desde) : "—";
    const hastaLabel = hasta ? formatFecha(hasta) : "—";

    const now = new Date();
    const fechaGen = now.toLocaleDateString("es-HN", { day:"2-digit", month:"2-digit", year:"numeric" });
    const horaGen = now.toLocaleTimeString("es-HN", { hour:"2-digit", minute:"2-digit" });

    // === HEADER ===
    doc.setFontSize(20);
    doc.setTextColor(0, 42, 92);
    doc.text("ICIMEDES", left, 18);
    doc.setFontSize(8);
    doc.setTextColor(91, 102, 122);
    doc.text("Instituto de Investigacion en Ciencias Medicas y Derecho a la Salud", left, 24);
    doc.setFontSize(7);
    doc.text("Generado: " + fechaGen + " " + horaGen, pw - left, 12, { align: "right" });
    doc.setDrawColor(0, 42, 92);
    doc.setLineWidth(0.5);
    doc.line(left, 27, pw - left, 27);

    doc.setFontSize(14);
    doc.setTextColor(11, 18, 32);
    doc.text("Reporte de Reservas", left, 33);
    doc.setFontSize(8);
    doc.setTextColor(91, 102, 122);
    doc.text("Periodo: " + desdeLabel + " al " + hastaLabel + " · " + total + " reservas", left, 38);

    // === KPIs ===
    const kpis = [
      { label: "TOTAL", value: total, clr: "#002a5c" },
      { label: "APROBADAS", value: aprobadas, clr: "#0f7b3a" },
      { label: "PENDIENTES", value: pendientes, clr: "#b88400" },
      { label: "RECHAZADAS", value: rechazadas, clr: "#b42318" }
    ];
    const kw = (pw - 28 - 12) / 4;
    const ky = 43;
    const kh = 17;

    kpis.forEach((k, i) => {
      const x = left + i * (kw + 4);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(228, 233, 244);
      doc.roundedRect(x, ky, kw, kh, 1.5, 1.5, "FD");
      const r = parseInt(k.clr.slice(1,3), 16);
      const g = parseInt(k.clr.slice(3,5), 16);
      const b = parseInt(k.clr.slice(5,7), 16);
      doc.setFillColor(r, g, b);
      doc.rect(x + 1, ky + 2, 0.6, kh - 4, "F");
      doc.setFontSize(13);
      doc.setTextColor(r, g, b);
      doc.text(String(k.value), x + kw / 2, ky + 9, { align: "center" });
      doc.setFontSize(6);
      doc.setTextColor(91, 102, 122);
      doc.text(k.label, x + kw / 2, ky + 14, { align: "center" });
    });

    // === CHARTS ===
    const hourlyCanvas = getEl("chartHourly");
    const weeklyCanvas = getEl("chartWeekly");
    const hourlyImg = hourlyCanvas ? hourlyCanvas.toDataURL("image/png") : null;
    const weeklyImg = weeklyCanvas ? weeklyCanvas.toDataURL("image/png") : null;

    const cy = ky + kh + 6;
    const cw = (pw - 42) / 2;
    const ch = 42;

    if (hourlyImg) {
      doc.setFontSize(9);
      doc.setTextColor(11, 18, 32);
      doc.text("Reservas por hora del dia", left, cy);
      doc.addImage(hourlyImg, "PNG", left, cy + 3, cw, ch);
    }
    if (weeklyImg) {
      doc.setFontSize(9);
      doc.setTextColor(11, 18, 32);
      doc.text("Reservas por dia de la semana", left + cw + 14, cy);
      doc.addImage(weeklyImg, "PNG", left + cw + 14, cy + 3, cw, ch);
    }

    // === TABLE ===
    const trows = filtered.map(r => [
      r.equipo_nombre || "-",
      r.nombre_completo || "-",
      r.nombre_proyecto || "-",
      formatFecha(r.fecha_reserva),
      formatHora(r.hora_inicio) + " - " + formatHora(r.hora_fin),
      r.estado || "-"
    ]);

    doc.autoTable({
      head: [["Equipo", "Solicitante", "Proyecto", "Fecha", "Hora", "Estado"]],
      body: trows,
      startY: cy + ch + 8,
      theme: "grid",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 42, 92], fontSize: 7, halign: "left", textColor: [255, 255, 255] },
      bodyStyles: { textColor: [11, 18, 32] },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      margin: { left: left, right: left }
    });

    doc.save("reporte_reservas_" + (desde || "todo") + "_" + (hasta || "todo") + ".pdf");
  }

  document.addEventListener("DOMContentLoaded", () => {
    getEl("btnFiltrarReportes").addEventListener("click", refreshDashboard);
    getEl("btnExportCSV").addEventListener("click", exportCSV);
    getEl("btnExportPDF").addEventListener("click", exportPDF);
  });

  window.initReports = initReports;
})();