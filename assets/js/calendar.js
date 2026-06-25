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
    eventModalBody.textContent = "";
    detail.forEach((item) => {
      const row = document.createElement("div");
      row.className = "modal-row";
      const spanEl = document.createElement("span");
      spanEl.textContent = item.label;
      const pEl = document.createElement("p");
      pEl.textContent = item.value || "-";
      row.appendChild(spanEl);
      row.appendChild(pEl);
      eventModalBody.appendChild(row);
    });
    eventModal.classList.remove("hidden");
  }

  function closeModal(){
    if (!eventModal) return;
    eventModal.classList.add("hidden");
  }

  async function cargarReservas(){
    const { data, error } = await window.supabaseClient
      .from("vw_reservas_calendario")
      .select("id, equipo_id, fecha_reserva, hora_inicio, hora_fin, nombre_completo, estado, equipo_nombre")
      .order("fecha_reserva", { ascending: true });

    if (error){
      console.error("Error cargando reservas:", error);
      return [];
    }

    return data.map((row) => {
      const color = row.estado === "aprobada" ? "#0f7b3a" : row.estado === "rechazada" ? "#b42318" : "#b88400";
      const horaInicio = normalizarHora(row.hora_inicio);
      const horaFin = normalizarHora(row.hora_fin);
      const equipoNombre = row.equipo_nombre || "Equipo";
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
          estado: row.estado || "pendiente",
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
  function buildDetailRows(data){
    return [
      { label: "Equipo", value: data.equipo },
      { label: "Nombre", value: data.nombreCompleto },
      { label: "Estado", value: data.estado },
      { label: "Fecha", value: data.fecha },
      { label: "Hora", value: data.horaInicio && data.horaFin ? `${data.horaInicio} - ${data.horaFin}` : "" }
    ];
  }

  function attachEventButton(info){
    if (!info || !info.el) return;
    const target = info.el.querySelector(".fc-event-main-frame") || info.el;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "event-detail-btn";
    button.setAttribute("aria-label", "Ver detalle");
    button.textContent = "i";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const data = info.event.extendedProps || {};
      openModal(buildDetailRows(data));
    });
    target.appendChild(button);
  }
  function getInitialView(){
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) {
      return "timeGridThreeDay";
    }
    return "timeGridWeek";
  }

  async function init(){
    if (!window.supabaseClient){
      equipoMeta.textContent = "Falta configurar Supabase (URL o anon key).";
      return;
    }

    window.calendarInstance = calendar = new FullCalendar.Calendar(calendarEl, {
      locale: "es",
      initialView: getInitialView(),
      height: "auto",
      nowIndicator: true,
      allDayText: "Todo el dia",
      slotMinTime: "07:00:00",
      slotMaxTime: "20:00:00",
      views: {
        timeGridThreeDay: {
          type: "timeGrid",
          duration: { days: 3 },
          buttonText: "3 dias"
        }
      },
      buttonText: {
        today: "hoy",
        week: "semana",
        month: "mes"
      },
      buttonHints: {
        prev: "Anterior",
        next: "Siguiente",
        today: "Ir a hoy",
        month: "Vista mensual",
        week: "Vista semanal",
        timeGridThreeDay: "Vista 3 dias"
      },
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "timeGridThreeDay,timeGridWeek,dayGridMonth"
      },
      eventDidMount: (info) => {
        attachEventButton(info);
      },
      events: async function(fetchInfo, successCallback, failureCallback){
        setLoading(true);
        try{
          const events = await cargarReservas();
          if (events.length === 0) {
            equipoMeta.textContent = "No hay reservas registradas.";
          } else {
            equipoMeta.textContent = "Todas las reservas de equipos.";
          }
          successCallback(events);
        } catch (error){
          failureCallback(error);
        }
        setLoading(false);
      }
    });

    calendar.render();
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
