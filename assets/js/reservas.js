(function(){
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const EMAIL_DOMAIN_REGEX = /^[A-Z0-9._%+-]+@(unah\.edu\.hn|unah\.hn)$/i;
  const EMPLEADO_REGEX = /^\d{4,6}$/;

  const form = document.getElementById("reservaForm");
  const statusBox = document.getElementById("formStatus");
  const submitBtn = document.getElementById("btnSubmit");

  const fields = {
    nombreCompleto: document.getElementById("nombreCompleto"),
    correo: document.getElementById("correo"),
    tipoUsuario: document.getElementById("tipoUsuario"),
    numEmpleado: document.getElementById("numEmpleado"),
    numCuenta: document.getElementById("numCuenta"),
    numRegistroProyecto: document.getElementById("numRegistroProyecto"),
    nombreProyecto: document.getElementById("nombreProyecto"),
    equipoId: document.getElementById("equipoId"),
    fechaReserva: document.getElementById("fechaReserva"),
    horaInicio: document.getElementById("horaInicio"),
    horaFin: document.getElementById("horaFin")
  };

  const sectionProfesor = document.getElementById("sectionProfesor");
  const sectionEstudiante = document.getElementById("sectionEstudiante");

  function setStatus(message, type){
    statusBox.textContent = message;
    statusBox.classList.remove("success", "error");
    if (type === "success") statusBox.classList.add("success");
    if (type === "error") statusBox.classList.add("error");
    statusBox.classList.remove("hidden");
  }

  function clearStatus(){
    statusBox.textContent = "";
    statusBox.classList.remove("success", "error");
    statusBox.classList.add("hidden");
  }

  function setError(fieldId, message){
    const input = fields[fieldId];
    const error = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (input) input.classList.add("field-error");
    if (error){
      error.textContent = message;
      error.classList.add("show");
    }
  }

  function clearErrors(){
    Object.keys(fields).forEach((key) => {
      const input = fields[key];
      const error = document.querySelector(`[data-error-for="${key}"]`);
      if (input) input.classList.remove("field-error");
      if (error){
        error.textContent = "";
        error.classList.remove("show");
      }
    });
  }

  function todayISO(){
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return local.toISOString().slice(0, 10);
  }

  function validate(){
    clearErrors();
    clearStatus();

    const data = {
      nombreCompleto: fields.nombreCompleto.value.trim(),
      correo: fields.correo.value.trim(),
      tipoUsuario: fields.tipoUsuario.value,
      numEmpleado: fields.numEmpleado.value.trim(),
      numCuenta: fields.numCuenta.value.trim(),
      numRegistroProyecto: fields.numRegistroProyecto.value.trim(),
      nombreProyecto: fields.nombreProyecto.value.trim(),
      equipoId: fields.equipoId.value,
      fechaReserva: fields.fechaReserva.value,
      horaInicio: fields.horaInicio.value,
      horaFin: fields.horaFin.value
    };

    let ok = true;

    if (!data.nombreCompleto){
      setError("nombreCompleto", "El nombre completo es obligatorio");
      ok = false;
    } else if (data.nombreCompleto.length < 5){
      setError("nombreCompleto", "El nombre completo debe tener al menos 5 caracteres");
      ok = false;
    } else if (data.nombreCompleto.length > 100){
      setError("nombreCompleto", "El nombre completo no debe superar 100 caracteres");
      ok = false;
    }

    if (!data.correo){
      setError("correo", "El correo es obligatorio");
      ok = false;
    } else if (!EMAIL_REGEX.test(data.correo)){
      setError("correo", "Formato de correo invalido");
      ok = false;
    } else if (!EMAIL_DOMAIN_REGEX.test(data.correo)){
      setError("correo", "Solo se permiten correos @unah.edu.hn o @unah.hn");
      ok = false;
    }

    if (!data.tipoUsuario){
      setError("tipoUsuario", "Debes seleccionar tu tipo de usuario");
      ok = false;
    }

    if (data.tipoUsuario === "profesor"){
      if (!data.numEmpleado){
        setError("numEmpleado", "El numero de empleado es obligatorio");
        ok = false;
      } else if (!EMPLEADO_REGEX.test(data.numEmpleado)){
        setError("numEmpleado", "El numero de empleado debe tener 4 a 6 digitos");
        ok = false;
      }
    }

    if (data.tipoUsuario === "estudiante"){
      if (!data.numCuenta){
        setError("numCuenta", "El numero de cuenta es obligatorio");
        ok = false;
      } else if (data.numCuenta.length > 10){
        setError("numCuenta", "El numero de cuenta no debe superar 10 caracteres");
        ok = false;
      }
    }

    if (!data.numRegistroProyecto){
      setError("numRegistroProyecto", "El numero de registro del proyecto es obligatorio");
      ok = false;
    } else if (data.numRegistroProyecto.length > 10){
      setError("numRegistroProyecto", "El numero de registro no debe superar 10 caracteres");
      ok = false;
    }

    if (!data.nombreProyecto){
      setError("nombreProyecto", "El nombre del proyecto es obligatorio");
      ok = false;
    } else if (data.nombreProyecto.length < 5){
      setError("nombreProyecto", "El nombre del proyecto debe tener al menos 5 caracteres");
      ok = false;
    } else if (data.nombreProyecto.length > 200){
      setError("nombreProyecto", "El nombre del proyecto no debe superar 200 caracteres");
      ok = false;
    }

    if (!data.equipoId){
      setError("equipoId", "Debes seleccionar un equipo");
      ok = false;
    }

    if (!data.fechaReserva){
      setError("fechaReserva", "La fecha de reserva es obligatoria");
      ok = false;
    } else if (data.fechaReserva < todayISO()){
      setError("fechaReserva", "La fecha no puede ser anterior a hoy");
      ok = false;
    }

    if (!data.horaInicio){
      setError("horaInicio", "La hora de inicio es obligatoria");
      ok = false;
    }

    if (!data.horaFin){
      setError("horaFin", "La hora de fin es obligatoria");
      ok = false;
    }

    if (data.horaInicio && data.horaFin && data.horaFin <= data.horaInicio){
      setError("horaFin", "La hora de fin debe ser posterior a la hora de inicio");
      ok = false;
    }

    return { ok, data };
  }

  function toggleTipoUsuario(){
    const tipo = fields.tipoUsuario.value;
    sectionProfesor.classList.toggle("hidden", tipo !== "profesor");
    sectionEstudiante.classList.toggle("hidden", tipo !== "estudiante");
  }

  async function cargarEquipos(){
    if (!window.supabaseClient){
      setStatus("Falta configurar Supabase (URL o anon key).", "error");
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("equipos")
      .select("id, nombre, tipo, descripcion, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error){
      setStatus("No se pudieron cargar los equipos.", "error");
      return;
    }

    fields.equipoId.innerHTML = "<option value=\"\">Seleccione un equipo</option>";
    data.forEach((equipo) => {
      const option = document.createElement("option");
      option.value = equipo.id;
      option.textContent = `${equipo.nombre} (${equipo.tipo})`;
      fields.equipoId.appendChild(option);
    });
  }

  async function enviarReserva(payload){
    const conflict = await window.supabaseClient.rpc("existe_conflicto", {
      p_equipo_id: payload.equipoId,
      p_fecha: payload.fechaReserva,
      p_inicio: payload.horaInicio,
      p_fin: payload.horaFin
    });

    if (conflict.error){
      throw new Error("No se pudo validar el horario.");
    }

    if (conflict.data){
      setStatus("Horario ocupado. Elija otra franja.", "error");
      return false;
    }

    const insertPayload = {
      equipo_id: payload.equipoId,
      nombre_completo: payload.nombreCompleto,
      correo: payload.correo,
      tipo_usuario: payload.tipoUsuario,
      num_empleado: payload.tipoUsuario === "profesor" ? payload.numEmpleado : null,
      num_cuenta: payload.tipoUsuario === "estudiante" ? payload.numCuenta : null,
      num_registro_proyecto: payload.numRegistroProyecto,
      nombre_proyecto: payload.nombreProyecto,
      fecha_reserva: payload.fechaReserva,
      hora_inicio: payload.horaInicio,
      hora_fin: payload.horaFin
    };

    const { error } = await window.supabaseClient
      .from("reservas")
      .insert([insertPayload]);

    if (error){
      throw new Error("No se pudo guardar la reserva.");
    }

    return true;
  }

  async function onSubmit(event){
    event.preventDefault();
    const { ok, data } = validate();

    if (!ok){
      setStatus("Revise los campos marcados en rojo.", "error");
      return;
    }

    submitBtn.disabled = true;

    try{
      const done = await enviarReserva(data);
      if (!done) return;

      form.reset();
      toggleTipoUsuario();
      setStatus("Reserva enviada. Recibira confirmacion por correo.", "success");
    } catch (error){
      setStatus(error.message || "Ocurrio un error inesperado.", "error");
    } finally{
      submitBtn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    toggleTipoUsuario();
    cargarEquipos();
    form.addEventListener("submit", onSubmit);
    fields.tipoUsuario.addEventListener("change", toggleTipoUsuario);
  });
})();
