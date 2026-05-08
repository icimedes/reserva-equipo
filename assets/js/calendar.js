(function(){
  const calendarEl = document.getElementById("calendar");
  const loadingEl = document.getElementById("calendarLoading");
  const equipoMeta = document.getElementById("equipoMeta");

  function setLoading(show){
    loadingEl.classList.toggle("show", show);
  }

  function normalizarHora(hora) {
    if (!hora) return "00:00:00";
    if (hora.length === 5) return hora + ":00";
    if (hora.length === 8) return hora;
    return "00:00:00";
  }

  async function cargarReservas(){
    const { data, error } = await window.supabaseClient
      .from("reservas")
      .select("id, equipo_id, fecha_reserva, hora_inicio, hora_fin, estado, equipos(nombre, tipo)")
      .neq("estado", "cancelada")
      .order("fecha_reserva", { ascending: true });

    if (error){
      console.error("Error cargando reservas:", error);
      return [];
    }

    return data.map((row) => {
      const color = row.estado === "aprobada" ? "#0f7b3a" : "#b88400";
      const horaInicio = normalizarHora(row.hora_inicio);
      const horaFin = normalizarHora(row.hora_fin);
      const equipoNombre = row.equipos?.nombre || "Equipo";
      return {
        id: row.id,
        title: `${equipoNombre} - Ocupado`,
        start: `${row.fecha_reserva}T${horaInicio}`,
        end: `${row.fecha_reserva}T${horaFin}`,
        backgroundColor: color,
        borderColor: color,
        display: "block"
      };
    });
  }

  let calendar;
  async function init(){
    if (!window.supabaseClient){
      equipoMeta.textContent = "Falta configurar Supabase (URL o anon key).";
      return;
    }

    window.calendarInstance = calendar = new FullCalendar.Calendar(calendarEl, {
      locale: "es",
      initialView: "timeGridWeek",
      height: "auto",
      nowIndicator: true,
      slotMinTime: "07:00:00",
      slotMaxTime: "20:00:00",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,dayGridMonth"
      },
      events: []
    });

    calendar.render();

    setLoading(true);
    const events = await cargarReservas();
    calendar.addEventSource(events);
    setLoading(false);

    if (events.length === 0) {
      equipoMeta.textContent = "No hay reservas registradas.";
    } else {
      equipoMeta.textContent = "Todas las reservas de equipos.";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
