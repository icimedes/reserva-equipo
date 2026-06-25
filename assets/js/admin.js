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

    card.innerHTML = `
      <div class="admin-card-header">
        <div>
          <h3>${row.equipo_nombre || "Equipo"}</h3>
          <p>${row.nombre_completo || ""}</p>
        </div>
        <span class="admin-tag">${row.estado}</span>
      </div>
      <div class="admin-card-body">
        <div>
          <span>Proyecto</span>
          <p>${row.nombre_proyecto || "-"}</p>
        </div>
        <div>
          <span>Registro</span>
          <p>${row.num_registro_proyecto || "-"}</p>
        </div>
        <div>
          <span>Fecha</span>
          <p>${formatFecha(row.fecha_reserva)}</p>
        </div>
        <div>
          <span>Hora</span>
          <p>${formatHora(row.hora_inicio)} - ${formatHora(row.hora_fin)}</p>
        </div>
      </div>
      <div class="admin-card-actions">
        <button class="btn secondary" data-action="eliminar">Eliminar</button>
        <button class="btn secondary" data-action="rechazar">Rechazar</button>
        <button class="btn" data-action="aprobar">Aprobar</button>
      </div>
    `;

    return card;
  }

  function buildEquipoCard(row){
    const card = document.createElement("div");
    card.className = `admin-card ${row.activo ? "approved" : "rejected"}`;
    card.dataset.id = row.id;
    card.dataset.nombre = row.nombre;
    card.dataset.activo = row.activo ? "1" : "0";

    card.innerHTML = `
      <div class="admin-card-header">
        <div>
          <h3>${row.nombre}</h3>
        </div>
        <span class="admin-tag">${row.activo ? "Activo" : "Inactivo"}</span>
      </div>
      <div class="admin-card-body">
        <div>
          <span>Reservas</span>
          <p>${row.total_reservas}</p>
        </div>
        <div>
          <span>Estado</span>
          <p>${row.activo ? "Disponible" : "Inactivo"}</p>
        </div>
      </div>
      <div class="admin-card-actions">
        <button class="btn secondary" data-action="editar">Editar</button>
        <button class="btn secondary" data-action="toggle">${row.activo ? "Desactivar" : "Activar"}</button>
        <button class="btn secondary" data-action="eliminar" style="color:var(--danger);border-color:rgba(180,35,24,.35);">Eliminar</button>
      </div>
    `;

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
