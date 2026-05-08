(function(){
  const calendarEl = document.getElementById("calendar");
  const loadingEl = document.getElementById("calendarLoading");
  const equipoMeta = document.getElementById("equipoMeta");
  const eventModal = document.getElementById("eventModal");
  const eventModalBody = document.getElementById("eventModalBody");
  const eventModalClose = document.getElementById("eventModalClose");

  function setLoading(show){
    loadingEl.classList.toggle("show", show);
  }

  function normalizarHora(hora) {
    if (!hora) return "00:00:00";
    if (hora.length === 5) return hora + ":00";
    if (hora.length === 8) return hora;
    return "00:00:00";
  }

  function formatDate(isoDate){
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatHour(timeValue){
    if (!timeValue) return "";
    return timeValue.slice(0, 5);
  }

  function openModal(detail){
    if (!eventModal || !eventModalBody) return;
    eventModalBody.innerHTML = detail.map((item) => {
      return `
        <div class="modal-row">
          <span>${item.label}</span>
          <p>${item.value || "-"}</p>
        </div>
      `;
    }).join("");
    eventModal.classList.remove("hidden");
  }

  function closeModal(){
    if (!eventModal) return;
    eventModal.classList.add("hidden");
  }

  async function cargarReservas(){
    const { data, error } = await window.supabaseClient
      .from("reservas")
      .select("id, equipo_id, fecha_reserva, hora_inicio, hora_fin, nombre_completo, correo, tipo_usuario, num_empleado, num_cuenta, num_registro_proyecto, nombre_proyecto, equipos(nombre, tipo)")
      .order("fecha_reserva", { ascending: true });

    if (error){
      console.error("Error cargando reservas:", error);
      return [];
    }

    return data.map((row) => {
      const color = "#0f7b3a";
      const horaInicio = normalizarHora(row.hora_inicio);
      const horaFin = normalizarHora(row.hora_fin);
      const equipoNombre = row.equipos?.nombre || "Equipo";
      const nombreCompleto = (row.nombre_completo || "").trim();
      const nombrePartes = nombreCompleto ? nombreCompleto.split(/\s+/) : [];
      const primerNombre = nombrePartes[0] || "";
      const primerApellido = nombrePartes.length > 1 ? nombrePartes[1] : "";
      const nombreCorto = [primerNombre, primerApellido].filter(Boolean).join(" ");
      return {
        id: row.id,
        title: nombreCorto ? `${equipoNombre} - ${nombreCorto}` : `${equipoNombre} - Ocupado`,
        start: `${row.fecha_reserva}T${horaInicio}`,
        end: `${row.fecha_reserva}T${horaFin}`,
        backgroundColor: color,
        borderColor: color,
        display: "block",
        extendedProps: {
          equipo: equipoNombre,
          fecha: formatDate(row.fecha_reserva),
          horaInicio: formatHour(row.hora_inicio),
          horaFin: formatHour(row.hora_fin),
          nombreCompleto: row.nombre_completo || "",
          correo: row.correo || "",
          tipoUsuario: row.tipo_usuario || "",
          numEmpleado: row.num_empleado || "",
          numCuenta: row.num_cuenta || "",
          numRegistroProyecto: row.num_registro_proyecto || "",
          nombreProyecto: row.nombre_proyecto || ""
        }
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
      eventClick: (info) => {
        const data = info.event.extendedProps || {};
        openModal([
          { label: "Equipo", value: data.equipo },
          { label: "Nombre", value: data.nombreCompleto },
          { label: "Correo", value: data.correo },
          { label: "Tipo", value: data.tipoUsuario },
          { label: "Numero de empleado", value: data.numEmpleado },
          { label: "Numero de cuenta", value: data.numCuenta },
          { label: "Proyecto", value: data.nombreProyecto },
          { label: "Registro", value: data.numRegistroProyecto },
          { label: "Fecha", value: data.fecha },
          { label: "Hora", value: data.horaInicio && data.horaFin ? `${data.horaInicio} - ${data.horaFin}` : "" }
        ]);
      },
      eventDidMount: (info) => {
        info.el.style.cursor = "pointer";
        info.el.addEventListener("click", () => {
          const data = info.event.extendedProps || {};
          openModal([
            { label: "Equipo", value: data.equipo },
            { label: "Nombre", value: data.nombreCompleto },
            { label: "Correo", value: data.correo },
            { label: "Tipo", value: data.tipoUsuario },
            { label: "Numero de empleado", value: data.numEmpleado },
            { label: "Numero de cuenta", value: data.numCuenta },
            { label: "Proyecto", value: data.nombreProyecto },
            { label: "Registro", value: data.numRegistroProyecto },
            { label: "Fecha", value: data.fecha },
            { label: "Hora", value: data.horaInicio && data.horaFin ? `${data.horaInicio} - ${data.horaFin}` : "" }
          ]);
        });
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

  document.addEventListener("DOMContentLoaded", () => {
    init();
    if (eventModalClose) {
      eventModalClose.addEventListener("click", closeModal);
    }
    if (eventModal) {
      eventModal.addEventListener("click", (event) => {
        if (event.target === eventModal) closeModal();
      });
    }
  });
})();
