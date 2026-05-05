(function(){
  const calendarEl = document.getElementById("calendar");
  const loadingEl = document.getElementById("calendarLoading");
  const equipoSelect = document.getElementById("equipoFiltro");
  const equipoMeta = document.getElementById("equipoMeta");

  function setLoading(show){
    loadingEl.classList.toggle("show", show);
  }

  function formatMeta(equipo){
    if (!equipo){
      equipoMeta.textContent = "Seleccione un equipo para ver la disponibilidad.";
      return;
    }
    equipoMeta.textContent = equipo.descripcion || "Calendario publico del equipo seleccionado.";
  }

  async function cargarEquipos(){
    const { data, error } = await window.supabaseClient
      .from("equipos")
      .select("id, nombre, tipo, descripcion, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error){
      equipoMeta.textContent = "No se pudieron cargar los equipos.";
      return [];
    }

    equipoSelect.innerHTML = "<option value=\"\">Seleccione un equipo</option>";
    data.forEach((equipo) => {
      const option = document.createElement("option");
      option.value = equipo.id;
      option.textContent = `${equipo.nombre} (${equipo.tipo})`;
      equipoSelect.appendChild(option);
    });

    return data;
  }

  async function cargarReservas(equipoId){
    if (!equipoId) return [];

    const { data, error } = await window.supabaseClient
      .from("reservas")
      .select("id, equipo_id, fecha_reserva, hora_inicio, hora_fin, estado")
      .eq("equipo_id", equipoId)
      .neq("estado", "cancelada")
      .order("fecha_reserva", { ascending: true });

    if (error){
      return [];
    }

    return data.map((row) => {
      const color = row.estado === "aprobada" ? "#0f7b3a" : row.estado === "pendiente" ? "#b88400" : "#667085";
      return {
        id: row.id,
        title: "Ocupado",
        start: `${row.fecha_reserva}T${row.hora_inicio}`,
        end: `${row.fecha_reserva}T${row.hora_fin}`,
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

    const equipos = await cargarEquipos();

    calendar = new FullCalendar.Calendar(calendarEl, {
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

    equipoSelect.addEventListener("change", async () => {
      const equipoId = equipoSelect.value;
      const equipo = equipos.find((item) => item.id === equipoId);
      formatMeta(equipo);
      setLoading(true);
      const events = await cargarReservas(equipoId);
      calendar.removeAllEvents();
      calendar.addEventSource(events);
      setLoading(false);
    });

    formatMeta(null);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
