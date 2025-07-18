function obtenerGastos() {
  return JSON.parse(localStorage.getItem("gastos") || "[]");
}

function guardarGastos(gastos) {
  localStorage.setItem("gastos", JSON.stringify(gastos));
}

function obtenerSaldoMensual(mes) {
  const saldos = JSON.parse(localStorage.getItem("saldos") || "{}");
  return saldos[mes] || 1200;
}

function guardarSaldoMensual(mes, cantidad) {
  const saldos = JSON.parse(localStorage.getItem("saldos") || "{}");
  saldos[mes] = cantidad;
  localStorage.setItem("saldos", JSON.stringify(saldos));
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function guardarNuevoSaldo() {
  const input = document.getElementById("nuevoSaldo");
  const mes = new Date().toISOString().slice(0, 7);
  const nuevo = parseFloat(input.value);
  if (!isNaN(nuevo) && nuevo >= 0) {
    guardarSaldoMensual(mes, nuevo);
    document.getElementById("modalSaldo").close();
    location.reload();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let gastos = obtenerGastos();
  const mesActual = new Date().toISOString().slice(0, 7);
  const filtro = document.getElementById("mesFiltro");
  const lista = document.getElementById("listaGastos");

  if (filtro && lista) {
    const mesesUnicos = [...new Set(gastos.map(g => g.fecha?.slice(0, 7)).filter(Boolean))].sort().reverse();
    filtro.innerHTML = `<option value="-">- Mostrar todos</option>` +
      mesesUnicos.map(m => `<option value="${m}">${m}</option>`).join("");
    filtro.value = "-";
    mostrarGastos(filtro.value);
    filtro.addEventListener("change", () => mostrarGastos(filtro.value));
  }

  function mostrarGastos(mes) {
    if (!lista) return;
    lista.innerHTML = "";
    gastos
      .map((g, i) => ({ ...g, index: i }))
      .filter(g => mes === "-" || g.fecha?.startsWith(mes))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .forEach(g => {
        const item = document.createElement("div");
        item.className = "bg-[#1F2937] rounded-xl p-4 shadow-md space-y-1";

        item.innerHTML = `
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold">${g.categoria} — €${parseFloat(g.monto).toFixed(2)}</p>
              <p class="text-sm text-gray-400">${formatearFecha(g.fecha)}</p>
              <p class="text-xs italic">${g.comentario || ""}</p>
            </div>
            <div class="flex gap-2">
              <button onclick="editarGasto(${g.index})" class="btn btn-sm btn-outline btn-info">✏️</button>
              <button onclick="confirmarEliminar(${g.index})" class="btn btn-sm btn-outline btn-error">🗑️</button>
            </div>
          </div>
        `;
        lista.appendChild(item);
      });
  }

  const saldoTxt = document.getElementById("saldoTotal");
  if (saldoTxt) {
    const totalGasto = gastos.filter(g => g.fecha?.startsWith(mesActual)).reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const saldoInicial = obtenerSaldoMensual(mesActual);
    const saldoFinal = saldoInicial - totalGasto;
    saldoTxt.textContent = "€" + saldoFinal.toFixed(2);

    const ahorroBox = document.getElementById("ahorroRecomendado");
    if (ahorroBox) {
      const ahorro = saldoInicial * 0.30;
      ahorroBox.textContent = "€" + ahorro.toFixed(2);
    }
  }

  window.editarGasto = function (index) {
    localStorage.setItem("editarIndex", index);
    window.location.href = "editar.html";
  }

  window.confirmarEliminar = function (index) {
    const modal = document.getElementById("modalConfirmar");
    const btn = document.getElementById("btnConfirmarEliminar");
    if (modal && btn) {
      modal.showModal();
      btn.onclick = () => {
        gastos.splice(index, 1);
        guardarGastos(gastos);
        location.reload();
      }
    }
  }

  const f = document.getElementById("formGasto");
  if (f) {
    const editarIndex = localStorage.getItem("editarIndex");
    if (editarIndex !== null) {
      const g = gastos[editarIndex];
      if (g) {
        document.getElementById("monto").value = g.monto;
        document.getElementById("categoria").value = g.categoria;
        document.getElementById("fecha").value = g.fecha;
        document.getElementById("comentario").value = g.comentario;
      }
    }
    f.addEventListener("submit", e => {
      e.preventDefault();
      const nuevo = {
        monto: document.getElementById("monto").value,
        categoria: document.getElementById("categoria").value,
        fecha: document.getElementById("fecha").value,
        comentario: document.getElementById("comentario").value
      };
      if (editarIndex !== null) {
        gastos[editarIndex] = nuevo;
        localStorage.removeItem("editarIndex");
      } else {
        gastos.push(nuevo);
      }
      guardarGastos(gastos);
      window.location.href = "transacciones.html";
    });
  }
});
