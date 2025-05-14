const API_URL = 'https://requesttoomaterialsapp.onrender.com/api/talleres';
//const API_URL = 'http://localhost:3000/api/talleres';

document.addEventListener("DOMContentLoaded", () => {
    cargarTalleres();
});

async function cargarTalleres() {
    const res = await fetch(API_URL);
    const talleres = await res.json();

    const selectTaller = document.getElementById("taller");
    selectTaller.innerHTML = `<option value="" disabled selected>Seleccione un taller</option>` +
        talleres.map(t => `<option value="${t._id}">${t.nombreTaller}</option>`).join("");

    selectTaller.addEventListener("change", () => {
        if (selectTaller.value) mostrarSolicitudes(selectTaller.value);
        else {
            document.getElementById("encargadoTaller").textContent = '';
            document.querySelector("#tablaSolicitudes tbody").innerHTML = '';
        }
    });
}

async function mostrarSolicitudes(tallerId) {
    const res = await fetch(`${API_URL}/${tallerId}`);
    const taller = await res.json();

    document.getElementById("encargadoTaller").textContent = taller.nombreEncargado;

    const tbody = document.querySelector("#tablaSolicitudes tbody");

    

    tbody.innerHTML = '';
    let hayMateriales = false;

    taller.solicitudes.forEach((s, solicitudIndex) => {
        s.materiales.forEach((m, materialIndex) => {
            hayMateriales = true;
            const fila = document.createElement('tr');

            const fechaMaterial = new Date(m.fecha);
            const fechaFormateada = fechaMaterial.toLocaleDateString() + ' ' + fechaMaterial.toLocaleTimeString();

            fila.innerHTML = `
                <td>${m.nombre}</td>
                <td>${m.cantidad}</td>
                <td>
                    <select onchange="cambiarEstado('${taller._id}', ${solicitudIndex}, ${materialIndex}, this.value)">
                        <option value="Solicitado" ${m.estado === 'Solicitado' ? 'selected' : ''}>Solicitado</option>
                        <option value="Entregado" ${m.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="Devuelto" ${m.estado === 'Devuelto' ? 'selected' : ''}>Devuelto</option>
                    </select>
                </td>
                <td>${fechaFormateada}</td>
                <td><button class="btn-eliminar" onclick="eliminarMaterial('${taller._id}', ${solicitudIndex}, ${materialIndex})">Eliminar</button></td>

            `;
            tbody.appendChild(fila);
        });
    });

    if (!hayMateriales) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay materiales registrados en las solicitudes</td></tr>';
    }
}

async function cambiarEstado(tallerId, solicitudIndex, materialIndex, nuevoEstado) {
    try {
        const res = await fetch(`${API_URL}/${tallerId}/solicitud/${solicitudIndex}/material/${materialIndex}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevoEstado })
        });
        if (!res.ok) throw new Error("No se pudo actualizar el estado");
    } catch (error) {
        alert("Error al actualizar el estado: " + error.message);
    }
}

async function agregarSolicitud() {
    const tallerId = document.getElementById("taller").value;
    const material = document.getElementById("material").value;
    const cantidad = document.getElementById("cantidad").value;

    if (!tallerId || !material || !cantidad) {
        alert("Por favor completa todos los campos.");
        return;
    }

    await fetch(`${API_URL}/${tallerId}/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materiales: [{ nombre: material, cantidad }] })
    });

    alert("Solicitud agregada correctamente.");
    document.getElementById("material").value = "";
    document.getElementById("cantidad").value = "";
    mostrarSolicitudes(tallerId);
}


// Función para enviar los datos de la tabla por correo
function enviarCorreo() {
    const filas = document.querySelectorAll('#tablaSolicitudes tbody tr');
    const datosTabla = [];

    // Recorrer todas las filas de la tabla
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        const material = celdas[0].innerText;
        const cantidad = celdas[1].innerText;
        const estado = celdas[2].querySelector('select') ? celdas[2].querySelector('select').value : celdas[2].innerText; // Obtener el estado actual, ya sea de un campo select o de texto

        datosTabla.push({ material, cantidad, estado });
    });

    // Verificamos si hay datos en la tabla
    if (datosTabla.length === 0) {
        alert("No hay solicitudes para enviar.");
        return;
    }

    // Enviar los datos al backend para ser procesados y enviados por correo
    fetch('http://localhost:3000/api/talleres/enviar-correo', {  // Usa localhost:3000, no 127.0.0.1:5500
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solicitudes: datosTabla })
    })
    .then(response => response.json())
    .then(data => {
        alert('Datos enviados por correo correctamente');
    })
    .catch(error => {
        console.error('Error al enviar los datos por correo:', error);
        alert('Hubo un error al enviar los datos por correo');
    });
}

async function eliminarMaterial(tallerId, solicitudIndex, materialIndex) {
    if (!confirm("¿Deseas eliminar este material?")) return;

    try {
        const res = await fetch(`${API_URL}/${tallerId}/solicitud/${solicitudIndex}/material/${materialIndex}`, {

            method: 'DELETE'
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Error al eliminar material");

        alert(data.message);
        mostrarSolicitudes(tallerId); // Recarga la tabla
    } catch (error) {
        console.error("Error al eliminar material:", error);
        alert("Hubo un error al eliminar el material: " + error.message);
    }
}





