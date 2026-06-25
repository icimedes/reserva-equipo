(function(){
  const loginCard = document.getElementById("loginCard");
  const adminContent = document.getElementById("adminContent");
  const reservasPanel = document.getElementById("reservasPanel");
  const equiposPanel = document.getElementById("equiposPanel");
  const reportsPanel = document.getElementById("reportsPanel");
  const loginForm = document.getElementById("loginForm");
  const adminToken = document.getElementById("adminToken");
  const loginStatus = document.getElementById("loginStatus");
  const btnSendLink = document.getElementById("btnSendLink");
  const btnLogout = document.getElementById("btnLogout");
  const adminCards = document.getElementById("adminCards");
  const equiposCards = document.getElementById("equiposCards");
  const equipoForm = document.getElementById("equipoForm");
  const equipoNombre = document.getElementById("equipoNombre");
  const btnGuardarEquipo = document.getElementById("btnGuardarEquipo");
  const btnCancelarEquipo = document.getElementById("btnCancelarEquipo");
  const equipoStatus = document.getElementById("equipoStatus");
  const ADMIN_TOKEN_KEY = "icimedes_admin_token";
  let currentToken = null;

  let editingEquipoId = null;
  let editingEquipoActivo = true;

  function setStatus(box, message, type){
    box.textContent = message;
    box.classList.remove("success", "error");
    if (type === "success") box.classList.add("success");
    if (type === "error") box.classList.add("error");
    box.classList.remove("hidden");
  }

  function setNotice(box, message){
    box.textContent = message;
    box.classList.remove("success", "error");
    box.classList.remove("hidden");
  }

  function clearStatus(box){
    box.textContent = "";
    box.classList.remove("success", "error");
    box.classList.add("hidden");
  }

  function setError(fieldId, message){
    const error = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (error){
      error.textContent = message;
      error.classList.add("show");
    }
  }

  function clearErrors(){
    document.querySelectorAll(".error-text").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show");
    });
  }

  function formatFecha(isoDate){
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatHora(timeValue){
    if (!timeValue) return "";
    return timeValue.slice(0, 5);
  }

  function estadoClass(estado){
    if (estado === "aprobada") return "approved";
    if (estado === "rechazada") return "rejected";
    return "pending";
  }

  function buildReservaCard(row){
    const card = document.createElement("div");
    card.className = `admin-card ${estadoClass(row.estado)}`;
    card.dataset.id = row.id;

    const header = document.createElement("div");
    header.className = "admin-card-header";
    const headerDiv = document.createElement("div");
    const h3 = document.createElement("h3");
    h3.textContent = row.equipo_nombre || "Equipo";
    const pName = document.createElement("p");
    pName.textContent = row.nombre_completo || "";
    headerDiv.appendChild(h3);
    headerDiv.appendChild(pName);
    const tag = document.createElement("span");
    tag.className = "admin-tag";
    tag.textContent = row.estado;
    header.appendChild(headerDiv);
    header.appendChild(tag);

    const body = document.createElement("div");
    body.className = "admin-card-body";
    const bodyFields = [
      { label: "Proyecto", value: row.nombre_proyecto || "-" },
      { label: "Registro", value: row.num_registro_proyecto || "-" },
      { label: "Fecha", value: formatFecha(row.fecha_reserva) },
      { label: "Hora", value: formatHora(row.hora_inicio) + " - " + formatHora(row.hora_fin) }
    ];
    bodyFields.forEach(f => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = f.label;
      const p = document.createElement("p");
      p.textContent = f.value;
      div.appendChild(span);
      div.appendChild(p);
      body.appendChild(div);
    });

    const actions = document.createElement("div");
    actions.className = "admin-card-actions";
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn secondary";
    btnEliminar.setAttribute("data-action", "eliminar");
    btnEliminar.textContent = "Eliminar";
    const btnRechazar = document.createElement("button");
    btnRechazar.className = "btn secondary";
    btnRechazar.setAttribute("data-action", "rechazar");
    btnRechazar.textContent = "Rechazar";
    const btnAprobar = document.createElement("button");
    btnAprobar.className = "btn";
    btnAprobar.setAttribute("data-action", "aprobar");
    btnAprobar.textContent = "Aprobar";
    actions.appendChild(btnEliminar);
    actions.appendChild(btnRechazar);
    actions.appendChild(btnAprobar);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    return card;
  }

  function buildEquipoCard(row){
    const card = document.createElement("div");
    card.className = `admin-card ${row.activo ? "approved" : "rejected"}`;
    card.dataset.id = row.id;
    card.dataset.nombre = row.nombre;
    card.dataset.activo = row.activo ? "1" : "0";

    const header = document.createElement("div");
    header.className = "admin-card-header";
    const headerDiv = document.createElement("div");
    const h3 = document.createElement("h3");
    h3.textContent = row.nombre;
    headerDiv.appendChild(h3);
    const tag = document.createElement("span");
    tag.className = "admin-tag";
    tag.textContent = row.activo ? "Activo" : "Inactivo";
    header.appendChild(headerDiv);
    header.appendChild(tag);

    const body = document.createElement("div");
    body.className = "admin-card-body";
    const divReservas = document.createElement("div");
    const spanReservas = document.createElement("span");
    spanReservas.textContent = "Reservas";
    const pReservas = document.createElement("p");
    pReservas.textContent = row.total_reservas;
    divReservas.appendChild(spanReservas);
    divReservas.appendChild(pReservas);
    const divEstado = document.createElement("div");
    const spanEstado = document.createElement("span");
    spanEstado.textContent = "Estado";
    const pEstado = document.createElement("p");
    pEstado.textContent = row.activo ? "Disponible" : "Inactivo";
    divEstado.appendChild(spanEstado);
    divEstado.appendChild(pEstado);
    body.appendChild(divReservas);
    body.appendChild(divEstado);

    const actions = document.createElement("div");
    actions.className = "admin-card-actions";
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn secondary";
    btnEditar.setAttribute("data-action", "editar");
    btnEditar.textContent = "Editar";
    const btnToggle = document.createElement("button");
    btnToggle.className = "btn secondary";
    btnToggle.setAttribute("data-action", "toggle");
    btnToggle.textContent = row.activo ? "Desactivar" : "Activar";
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn secondary";
    btnEliminar.setAttribute("data-action", "eliminar");
    btnEliminar.style.color = "var(--danger)";
    btnEliminar.style.borderColor = "rgba(180,35,24,.35)";
    btnEliminar.textContent = "Eliminar";
    actions.appendChild(btnEditar);
    actions.appendChild(btnToggle);
    actions.appendChild(btnEliminar);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    return card;
  }

  async function validateToken(token){
    const { data, error } = await window.supabaseClient
      .rpc("admin_validate_token", { p_token: token });

    if (error) return false;
    return !!data;
  }

  async function loadReservas(){
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token){
      showLogin();
      return;
    }

    const { data, error } = await window.supabaseClient
      .rpc("admin_get_reservas", { p_token: token });

    if (error){
      setStatus(loginStatus, "No se pudo cargar el listado.", "error");
      return;
    }

    adminCards.innerHTML = "";
    (data || []).forEach((row) => {
      const card = buildReservaCard(row);
      adminCards.appendChild(card);
    });
  }

  async function loadEquipos(){
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    const { data, error } = await window.supabaseClient
      .rpc("admin_get_equipos", { p_token: token });

    if (error){
      setStatus(equipoStatus, "No se pudieron cargar los equipos.", "error");
      return;
    }

    equiposCards.innerHTML = "";
    (data || []).forEach((row) => {
      const card = buildEquipoCard(row);
      equiposCards.appendChild(card);
    });
  }

  async function updateReserva(id, estado){
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return false;

    const { error } = await window.supabaseClient
      .rpc("admin_set_estado", { p_token: token, p_id: id, p_estado: estado });

    if (error){
      setStatus(loginStatus, "No se pudo actualizar el estado.", "error");
      return false;
    }
    return true;
  }

  async function deleteReserva(id){
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return false;

    const { error } = await window.supabaseClient
      .rpc("admin_delete_reserva", { p_token: token, p_id: id });

    if (error){
      setStatus(loginStatus, "No se pudo eliminar la reserva.", "error");
      return false;
    }
    return true;
  }

  function showLogin(){
    loginCard.classList.remove("hidden");
    adminContent.classList.add("hidden");
  }

  function showPanel(token){
    currentToken = token;
    loginCard.classList.add("hidden");
    adminContent.classList.remove("hidden");
    switchTab("reservas");
  }

  function switchTab(tabId){
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const panel = document.getElementById(tabId + "Panel");
    if (panel) panel.classList.remove("hidden");
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.classList.add("active");

    if (tabId === "reservas"){
      loadReservas();
      loadEquipos();
    }
    if (tabId === "equipos"){
      loadEquipos();
    }
    if (tabId === "reportes" && window.initReports){
      window.initReports(currentToken);
    }
  }

  function resetEquipoForm(){
    equipoForm.reset();
    editingEquipoId = null;
    editingEquipoActivo = true;
    btnGuardarEquipo.textContent = "Guardar equipo";
    btnCancelarEquipo.classList.add("hidden");
    clearErrors();
    clearStatus(equipoStatus);
  }

  function fillEquipoForm(row){
    equipoNombre.value = row.nombre;
    editingEquipoId = row.id;
    editingEquipoActivo = row.activo;
    btnGuardarEquipo.textContent = "Actualizar equipo";
    btnCancelarEquipo.classList.remove("hidden");
    clearErrors();
    setNotice(equipoStatus, `Editando: ${row.nombre}`);
  }

  async function onLogin(event){
    event.preventDefault();
    clearErrors();
    clearStatus(loginStatus);

    const token = adminToken.value.trim();
    if (!token){
      setError("adminToken", "El token es obligatorio");
      return;
    }

    btnSendLink.disabled = true;
    try{
      const ok = await validateToken(token);
      if (!ok){
        setStatus(loginStatus, "Token invalido.", "error");
        return;
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      showPanel(token);
    } finally{
      btnSendLink.disabled = false;
    }
  }

  async function onLogout(){
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    showLogin();
  }

  async function onEquipoSubmit(event){
    event.preventDefault();
    clearErrors();
    clearStatus(equipoStatus);

    const nombre = equipoNombre.value.trim();

    if (!nombre){
      setError("equipoNombre", "El nombre es obligatorio");
      return;
    }
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    btnGuardarEquipo.disabled = true;

    try{
      if (editingEquipoId){
        const { error } = await window.supabaseClient
          .rpc("admin_update_equipo", {
            p_token: token,
            p_id: editingEquipoId,
            p_nombre: nombre,
            p_activo: editingEquipoActivo
          });
        if (error){
          setStatus(equipoStatus, error.message, "error");
          return;
        }
        resetEquipoForm();
        setStatus(equipoStatus, "Equipo actualizado correctamente.", "success");
      } else {
        const { error } = await window.supabaseClient
          .rpc("admin_create_equipo", {
            p_token: token,
            p_nombre: nombre
          });
        if (error){
          setStatus(equipoStatus, error.message, "error");
          return;
        }
        resetEquipoForm();
        setStatus(equipoStatus, "Equipo creado correctamente.", "success");
      }
      await loadEquipos();
    } finally{
      btnGuardarEquipo.disabled = false;
    }
  }

  adminCards.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = event.target.closest(".admin-card");
    if (!card) return;
    const id = card.dataset.id;
    const action = button.dataset.action;
    if (action === "eliminar"){
      const ok = window.confirm("Desea eliminar esta reserva?");
      if (!ok) return;
      const done = await deleteReserva(id);
      if (done) await loadReservas();
      return;
    }

    const estado = action === "aprobar" ? "aprobada" : "rechazada";
    const done = await updateReserva(id, estado);
    if (done) await loadReservas();
  });

  equiposCards.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = event.target.closest(".admin-card");
    if (!card) return;
    const id = card.dataset.id;
    const action = button.dataset.action;

    if (action === "eliminar"){
      const ok = window.confirm("Desea eliminar este equipo?");
      if (!ok) return;
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const { error } = await window.supabaseClient
        .rpc("admin_delete_equipo", { p_token: token, p_id: id });
      if (error){
        setStatus(equipoStatus, error.message, "error");
        return;
      }
      if (editingEquipoId === id){
        resetEquipoForm();
      }
      await loadEquipos();
      return;
    }

    if (action === "editar"){
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const { data } = await window.supabaseClient
        .rpc("admin_get_equipos", { p_token: token });
      const equipo = (data || []).find(e => e.id === id);
      if (equipo){
        fillEquipoForm(equipo);
        equipoNombre.focus();
      }
      return;
    }

    if (action === "toggle"){
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const nombre = card.dataset.nombre || "";
      const activo = card.dataset.activo === "1";
      const { error } = await window.supabaseClient
        .rpc("admin_update_equipo", {
          p_token: token,
          p_id: id,
          p_nombre: nombre,
          p_activo: !activo
        });
      if (error){
        setStatus(equipoStatus, error.message, "error");
        return;
      }
      if (editingEquipoId === id){
        editingEquipoActivo = !activo;
        setNotice(equipoStatus, `Editando: ${nombre} (${editingEquipoActivo ? "Activo" : "Inactivo"})`);
      }
      await loadEquipos();
    }
  });

  document.addEventListener("click", (event) => {
    const tabBtn = event.target.closest(".tab-btn");
    if (tabBtn){
      const tab = tabBtn.dataset.tab;
      if (tab) switchTab(tab);
    }
  });

  btnLogout.addEventListener("click", onLogout);
  loginForm.addEventListener("submit", onLogin);
  equipoForm.addEventListener("submit", onEquipoSubmit);
  btnCancelarEquipo.addEventListener("click", () => {
    resetEquipoForm();
    setNotice(equipoStatus, "Edicion cancelada.");
  });

  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token){
      showLogin();
      return;
    }
    showPanel(token);
  });
})();
