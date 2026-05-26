(function(){
  const loginCard = document.getElementById("loginCard");
  const adminPanel = document.getElementById("adminPanel");
  const loginForm = document.getElementById("loginForm");
  const adminToken = document.getElementById("adminToken");
  const loginStatus = document.getElementById("loginStatus");
  const btnSendLink = document.getElementById("btnSendLink");
  const btnLogout = document.getElementById("btnLogout");
  const adminCards = document.getElementById("adminCards");
  const ADMIN_TOKEN_KEY = "icimedes_admin_token";

  function setStatus(box, message, type){
    box.textContent = message;
    box.classList.remove("success", "error");
    if (type === "success") box.classList.add("success");
    if (type === "error") box.classList.add("error");
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

  function buildCard(row){
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
        <button class="btn secondary" data-action="rechazar">Rechazar</button>
        <button class="btn" data-action="aprobar">Aprobar</button>
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
    data.forEach((row) => {
      const card = buildCard(row);
      adminCards.appendChild(card);
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

  function showLogin(){
    loginCard.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }

  function showPanel(){
    loginCard.classList.add("hidden");
    adminPanel.classList.remove("hidden");
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
      showPanel();
      await loadReservas();
    } finally{
      btnSendLink.disabled = false;
    }
  }

  async function onLogout(){
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    showLogin();
  }

  adminCards.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = event.target.closest(".admin-card");
    if (!card) return;
    const id = card.dataset.id;
    const action = button.dataset.action;
    const estado = action === "aprobar" ? "aprobada" : "rechazada";
    const done = await updateReserva(id, estado);
    if (done) await loadReservas();
  });

  btnLogout.addEventListener("click", onLogout);
  loginForm.addEventListener("submit", onLogin);

  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token){
      showLogin();
      return;
    }
    showPanel();
    loadReservas();
  });
})();
