import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const pantallaAcceso = document.getElementById('pantallaAcceso');
const appPrincipal = document.getElementById('appPrincipal');
const formAcceso = document.getElementById('formAcceso');
const mensajeAcceso = document.getElementById('mensajeAcceso');
const botonSalir = document.getElementById('botonSalir');

let dejarDeEscuchar = null;
let dejarDeEscucharHoy = null;

formAcceso.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensajeAcceso.textContent = '';
  const correo = document.getElementById('correoAcceso').value.trim();
  const clave = document.getElementById('claveAcceso').value;
  try {
    await signInWithEmailAndPassword(auth, correo, clave);
  } catch (error) {
    mensajeAcceso.textContent = 'Correo o contraseña incorrectos.';
    mensajeAcceso.className = 'mensaje-formulario error';
  }
});

botonSalir.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    pantallaAcceso.hidden = true;
    appPrincipal.hidden = false;
    if (!dejarDeEscuchar) dejarDeEscuchar = iniciarEscuchaClientes();
    if (!dejarDeEscucharHoy) {
      limpiarDiasAnteriores();
      dejarDeEscucharHoy = iniciarEscuchaHoy();
    }
  } else {
    pantallaAcceso.hidden = false;
    appPrincipal.hidden = true;
    if (dejarDeEscuchar) {
      dejarDeEscuchar();
      dejarDeEscuchar = null;
    }
    if (dejarDeEscucharHoy) {
      dejarDeEscucharHoy();
      dejarDeEscucharHoy = null;
    }
  }
});

const form = document.getElementById('formCliente');
const listado = document.getElementById('listadoClientes');
const buscador = document.getElementById('buscador');
const mensajeFormulario = document.getElementById('mensajeFormulario');
const botonCancelar = document.getElementById('botonCancelar');
const botonGuardar = document.getElementById('botonGuardar');
const modoFormulario = document.getElementById('modoFormulario');
const contadorClientes = document.getElementById('contadorClientes');
const estadoConexion = document.getElementById('estadoConexion');

let clienteEnEdicion = null;
let todosLosClientes = [];
let entradasHoy = [];

const listaHoy = document.getElementById('listaHoy');
const fechaHoyEtiqueta = document.getElementById('fechaHoy');

function fechaDeHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

const atendidosHoyRef = collection(db, 'atendidosHoy');

async function limpiarDiasAnteriores() {
  try {
    const hoy = fechaDeHoy();
    const todos = await getDocs(atendidosHoyRef);
    const borrados = todos.docs
      .filter((d) => d.data().fecha !== hoy)
      .map((d) => deleteDoc(doc(db, 'atendidosHoy', d.id)));
    await Promise.all(borrados);
  } catch (error) {
    console.error('No se pudo limpiar la lista de días anteriores:', error);
  }
}

function iniciarEscuchaHoy() {
  const hoy = fechaDeHoy();
  fechaHoyEtiqueta.textContent = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const consultaHoy = query(atendidosHoyRef, where('fecha', '==', hoy));
  return onSnapshot(
    consultaHoy,
    (snapshot) => {
      entradasHoy = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.agregadoEn?.seconds || 0) - (b.agregadoEn?.seconds || 0));
      renderizarListaHoy();
      renderizarClientes(filtrar(todosLosClientes, buscador.value.trim()));
    },
    (error) => console.error('Error escuchando la lista de hoy:', error)
  );
}

function renderizarListaHoy() {
  if (entradasHoy.length === 0) {
    listaHoy.innerHTML = '<p class="vacio">Aún no has agregado clientes a la lista de hoy.</p>';
    return;
  }

  listaHoy.innerHTML = entradasHoy
    .map(
      (e) => `
    <div class="fila-hoy ${e.facturado ? 'facturado' : ''}" data-id="${e.id}">
      <label class="check-facturado">
        <input type="checkbox" class="marcar-facturado" data-id="${e.id}" ${e.facturado ? 'checked' : ''} />
        <span>${escaparHtml(e.nombreCompleto)} <span class="tarjeta-linea">— ${escaparHtml(e.identificacion || '')}</span></span>
      </label>
      <button type="button" class="quitar-hoy" data-id="${e.id}" title="Quitar de la lista de hoy">✕</button>
    </div>
  `
    )
    .join('');
}

const clientesRef = collection(db, 'clientes');
const consultaOrdenada = query(clientesRef, orderBy('createdAt', 'desc'));

function iniciarEscuchaClientes() {
  return onSnapshot(
    consultaOrdenada,
    (snapshot) => {
      estadoConexion.className = 'cabecera-estado ok';
      estadoConexion.querySelector('.texto').textContent = 'Base de datos conectada';
      todosLosClientes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderizarClientes(filtrar(todosLosClientes, buscador.value.trim()));
    },
    (error) => {
      estadoConexion.className = 'cabecera-estado error';
      estadoConexion.querySelector('.texto').textContent = 'Sin conexión a la base de datos';
      listado.innerHTML = `<p class="vacio">No se pudo conectar con Firebase. Revisa tu configuración en firebase-config.js y las reglas de Firestore.</p>`;
      console.error(error);
    }
  );
}

function filtrar(clientes, texto) {
  if (!texto) return clientes;
  const t = texto.toLowerCase();
  return clientes.filter((c) =>
    [c.nombreCompleto, c.identificacion, c.telefono, c.ciudad]
      .filter(Boolean)
      .some((campo) => campo.toLowerCase().includes(t))
  );
}

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('');
}

function escaparHtml(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function renderizarClientes(clientes) {
  contadorClientes.textContent = `${clientes.length} cliente${clientes.length === 1 ? '' : 's'}`;

  if (clientes.length === 0) {
    listado.innerHTML = '<p class="vacio">Aún no hay clientes registrados. Usa el formulario para agregar el primero.</p>';
    return;
  }

  listado.innerHTML = clientes
    .map(
      (c) => {
        const yaEnHoy = entradasHoy.some((e) => e.clienteId === c.id);
        return `
    <article class="tarjeta-cliente" data-id="${c.id}">
      <div class="tarjeta-info">
        <h3>${escaparHtml(c.nombreCompleto)}</h3>
        <p class="tarjeta-linea"><strong>${escaparHtml(c.tipoIdentificacion || 'RUC')}:</strong> ${escaparHtml(c.identificacion)}</p>
        <p class="tarjeta-linea">${escaparHtml(c.direccion)}</p>
        <p class="tarjeta-linea">☎ ${escaparHtml(c.telefono)}${c.correo ? ' · ' + escaparHtml(c.correo) : ''}</p>
      </div>
      <div class="sello-ciudad">${escaparHtml((c.ciudad || iniciales(c.nombreCompleto) || '—').slice(0, 10))}</div>
      <div class="tarjeta-acciones">
        <button type="button" class="editar" data-id="${c.id}">Editar</button>
        <button type="button" class="eliminar" data-id="${c.id}">Eliminar</button>
        <button type="button" class="agregar-hoy ${yaEnHoy ? 'activo' : ''}" data-id="${c.id}">${yaEnHoy ? '✓ En hoy' : '+ Hoy'}</button>
      </div>
    </article>
  `;
      }
    )
    .join('');
}

function limpiarFormulario() {
  form.reset();
  document.getElementById('clienteId').value = '';
  clienteEnEdicion = null;
  modoFormulario.textContent = '— Registrar cliente';
  botonGuardar.textContent = 'Guardar ficha';
  botonCancelar.hidden = true;
  mensajeFormulario.textContent = '';
  mensajeFormulario.className = 'mensaje-formulario';
}

function cargarEnFormulario(cliente) {
  document.getElementById('clienteId').value = cliente.id;
  document.getElementById('nombreCompleto').value = cliente.nombreCompleto;
  document.getElementById('tipoIdentificacion').value = cliente.tipoIdentificacion || 'RUC';
  document.getElementById('identificacion').value = cliente.identificacion;
  document.getElementById('direccion').value = cliente.direccion;
  document.getElementById('telefono').value = cliente.telefono;
  document.getElementById('ciudad').value = cliente.ciudad || '';
  document.getElementById('correo').value = cliente.correo || '';
  clienteEnEdicion = cliente.id;
  modoFormulario.textContent = '— Editando ficha';
  botonGuardar.textContent = 'Actualizar ficha';
  botonCancelar.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensajeFormulario.textContent = '';

  const datos = {
    nombreCompleto: document.getElementById('nombreCompleto').value.trim(),
    tipoIdentificacion: document.getElementById('tipoIdentificacion').value,
    identificacion: document.getElementById('identificacion').value.trim(),
    direccion: document.getElementById('direccion').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    ciudad: document.getElementById('ciudad').value.trim(),
    correo: document.getElementById('correo').value.trim(),
  };

  if (!datos.nombreCompleto || !datos.identificacion || !datos.direccion || !datos.telefono) {
    mensajeFormulario.textContent = 'Completa los campos obligatorios: nombre, identificación, dirección y teléfono.';
    mensajeFormulario.className = 'mensaje-formulario error';
    return;
  }

  try {
    if (clienteEnEdicion) {
      await updateDoc(doc(db, 'clientes', clienteEnEdicion), { ...datos, updatedAt: serverTimestamp() });
      mensajeFormulario.textContent = 'Ficha actualizada correctamente.';
    } else {
      await addDoc(clientesRef, { ...datos, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      mensajeFormulario.textContent = 'Cliente guardado correctamente.';
    }
    mensajeFormulario.className = 'mensaje-formulario ok';
    limpiarFormulario();
  } catch (error) {
    mensajeFormulario.textContent = 'No se pudo guardar: ' + error.message;
    mensajeFormulario.className = 'mensaje-formulario error';
  }
});

botonCancelar.addEventListener('click', limpiarFormulario);

listado.addEventListener('click', async (evento) => {
  const id = evento.target.dataset.id;
  if (!id) return;

  if (evento.target.classList.contains('editar')) {
    const cliente = todosLosClientes.find((c) => c.id === id);
    if (cliente) cargarEnFormulario(cliente);
  }

  if (evento.target.classList.contains('eliminar')) {
    const confirmado = confirm('¿Eliminar esta ficha de cliente? Esta acción no se puede deshacer.');
    if (!confirmado) return;
    await deleteDoc(doc(db, 'clientes', id));
    if (clienteEnEdicion === id) limpiarFormulario();
  }

  if (evento.target.classList.contains('agregar-hoy')) {
    const existente = entradasHoy.find((e) => e.clienteId === id);
    if (existente) {
      await deleteDoc(doc(db, 'atendidosHoy', existente.id));
    } else {
      const cliente = todosLosClientes.find((c) => c.id === id);
      if (!cliente) return;
      await addDoc(atendidosHoyRef, {
        clienteId: cliente.id,
        nombreCompleto: cliente.nombreCompleto,
        identificacion: cliente.identificacion,
        fecha: fechaDeHoy(),
        facturado: false,
        agregadoEn: serverTimestamp(),
      });
    }
  }
});

listaHoy.addEventListener('click', async (evento) => {
  const id = evento.target.dataset.id;
  if (!id) return;

  if (evento.target.classList.contains('quitar-hoy')) {
    await deleteDoc(doc(db, 'atendidosHoy', id));
  }
});

listaHoy.addEventListener('change', async (evento) => {
  if (!evento.target.classList.contains('marcar-facturado')) return;
  const id = evento.target.dataset.id;
  await updateDoc(doc(db, 'atendidosHoy', id), { facturado: evento.target.checked });
});

buscador.addEventListener('input', () => {
  renderizarClientes(filtrar(todosLosClientes, buscador.value.trim()));
});
