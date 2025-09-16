// ========================================
// PUBLIC/JS/ENTRY-TICKET.JS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
  let selectedProveedorId = null;
  let productosEnVale = [];
  let productCounter = 0;
  const sistemaActual = document.body.getAttribute('data-sistema');

  let API_PREFIX = '/entry-ticket/api';

  if (sistemaActual === 'GENERAL') {
      API_PREFIX = '/entry-ticket/general/api';
  } else if (sistemaActual === 'OFICIALIA') {
      API_PREFIX = '/entry-ticket/oficialia/api';
  }


  console.log(`Sistema activo: ${sistemaActual}, API Prefix: ${API_PREFIX}`);
  // Definir AppUtils
  const AppUtils = {
    showAlert: function(message, type = 'info') {
      console.log(`${type.toUpperCase()}: ${message}`);
      
      if (type === 'error') {
        alert(`ERROR: ${message}`);
      } else if (type === 'warning') {
        alert(`ADVERTENCIA: ${message}`);
      } else if (type === 'success') {
        alert(`ÉXITO: ${message}`);
      } else {
        alert(message);
      }
    }
  };

  // Inicializar fecha actual
  const now = new Date();
  const fechaFormateada = now.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('fechaEntrada').value = fechaFormateada;

  // ========================================
  // FUNCIONALIDAD DE PROVEEDORES
  // ========================================

  const proveedorInput = document.getElementById('proveedor');
  const proveedorSuggestions = document.getElementById('proveedorSuggestions');
  const proveedorRfcInput = document.getElementById('proveedorRfc');
  const repartidorSelect = document.getElementById('repartidor');
  const btnNuevoRepartidor = document.getElementById('btnNuevoRepartidor');

  let proveedorTimeout;

  // Búsqueda de proveedores
  proveedorInput.addEventListener('input', function() {
    clearTimeout(proveedorTimeout);
    const query = this.value.trim();

    if (query.length < 2) {
      proveedorSuggestions.classList.add('hidden');
      resetProveedor();
      return;
    }

    proveedorTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_PREFIX}/search-proveedores?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.proveedores.length > 0) {
          mostrarSugerenciasProveedor(data.proveedores);
        } else {
          proveedorSuggestions.classList.add('hidden');
        }
      } catch (error) {
        console.error('Error al buscar proveedores:', error);
      }
    }, 300);
  });

  function mostrarSugerenciasProveedor(proveedores) {
    proveedorSuggestions.innerHTML = '';
    
    proveedores.forEach(proveedor => {
      const div = document.createElement('div');
      div.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0';
      div.innerHTML = `
        <div class="font-medium text-gray-900">${proveedor.proveedor}</div>
        <div class="text-sm text-gray-500">RFC: ${proveedor.rfc || 'No especificado'}</div>
      `;
      
      div.addEventListener('click', () => {
        seleccionarProveedor(proveedor);
      });
      
      proveedorSuggestions.appendChild(div);
    });
    
    proveedorSuggestions.classList.remove('hidden');
  }

  function seleccionarProveedor(proveedor) {
    selectedProveedorId = proveedor.id_proveedor;
    proveedorInput.value = proveedor.proveedor;
    proveedorRfcInput.value = proveedor.rfc || '';
    document.getElementById('selectedProveedorId').value = proveedor.id_proveedor;
    proveedorSuggestions.classList.add('hidden');
    
    // Habilitar repartidor y cargar opciones
    cargarRepartidores(proveedor.id_proveedor);
  }

  function resetProveedor() {
    selectedProveedorId = null;
    proveedorRfcInput.value = '';
    document.getElementById('selectedProveedorId').value = '';
    repartidorSelect.innerHTML = '<option value="">Primero seleccione un proveedor</option>';
    repartidorSelect.disabled = true;
    btnNuevoRepartidor.disabled = true;
    btnNuevoRepartidor.classList.add('bg-gray-400', 'cursor-not-allowed');
    btnNuevoRepartidor.classList.remove('bg-green-600', 'hover:bg-green-700');
  }

  // Cargar repartidores
  async function cargarRepartidores(idProveedor) {
    try {
      const response = await fetch(`${API_PREFIX}/repartidores/${idProveedor}`);
      const data = await response.json();

      repartidorSelect.innerHTML = '<option value="">Seleccionar repartidor</option>';
      
      if (data.success && data.repartidores.length > 0) {
        data.repartidores.forEach(repartidor => {
          const option = document.createElement('option');
          option.value = repartidor.id_repartidor;
          option.textContent = repartidor.repartidor;
          repartidorSelect.appendChild(option);
        });
      }
      
      repartidorSelect.disabled = false;
      repartidorSelect.classList.remove('bg-gray-100');
      btnNuevoRepartidor.disabled = false;
      btnNuevoRepartidor.classList.remove('bg-gray-400', 'cursor-not-allowed');
      btnNuevoRepartidor.classList.add('bg-green-600', 'hover:bg-green-700');
      
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
    }
  }

  // Ocultar sugerencias al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!proveedorInput.contains(e.target) && !proveedorSuggestions.contains(e.target)) {
      proveedorSuggestions.classList.add('hidden');
    }
  });

  // ========================================
  // MODALES PARA CREAR PROVEEDOR Y REPARTIDOR
  // ========================================

  // Botón nuevo proveedor
  document.getElementById('btnNuevoProveedor').addEventListener('click', function() {
    mostrarModalProveedor();
  });

  // Botón nuevo repartidor
  document.getElementById('btnNuevoRepartidor').addEventListener('click', function() {
    if (selectedProveedorId) {
      mostrarModalRepartidor();
    }
  });

  function mostrarModalProveedor() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Nuevo Proveedor</h3>
          <form id="formNuevoProveedor">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del Proveedor *</label>
                <input type="text" id="nuevoProveedorNombre" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">RFC</label>
                <input type="text" id="nuevoProveedorRfc" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Domicilio</label>
                <textarea id="nuevoProveedorDomicilio" rows="2" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="text" id="nuevoProveedorTelefono" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" class="cerrar-modal px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancelar</button>
              <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Crear</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cerrar modal
    modal.querySelector('.cerrar-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Submit form
    modal.querySelector('#formNuevoProveedor').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const proveedorData = {
        proveedor: modal.querySelector('#nuevoProveedorNombre').value,
        rfc: modal.querySelector('#nuevoProveedorRfc').value,
        domicilio: modal.querySelector('#nuevoProveedorDomicilio').value,
        telefono: modal.querySelector('#nuevoProveedorTelefono').value
      };

      try {
        const response = await fetch(`${API_PREFIX}/create-proveedor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proveedorData)
        });

        const data = await response.json();

        if (data.success) {
          seleccionarProveedor(data.proveedor);
          document.body.removeChild(modal);
          AppUtils.showAlert('Proveedor creado exitosamente', 'success');
        } else {
          AppUtils.showAlert('Error al crear proveedor', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        AppUtils.showAlert('Error al crear proveedor', 'error');
      }
    });
  }

  function mostrarModalRepartidor() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Nuevo Repartidor</h3>
          <form id="formNuevoRepartidor">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Nombre del Repartidor *</label>
                <input type="text" id="nuevoRepartidorNombre" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Proveedor</label>
                <input type="text" value="${proveedorInput.value}" disabled class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" class="cerrar-modal px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancelar</button>
              <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Crear</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cerrar modal
    modal.querySelector('.cerrar-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Submit form
    modal.querySelector('#formNuevoRepartidor').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const repartidorData = {
        repartidor: modal.querySelector('#nuevoRepartidorNombre').value,
        id_proveedor: selectedProveedorId
      };

      try {
        const response = await fetch(`${API_PREFIX}/create-repartidor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(repartidorData)
        });

        const data = await response.json();

        if (data.success) {
          // Recargar repartidores y seleccionar el nuevo
          await cargarRepartidores(selectedProveedorId);
          repartidorSelect.value = data.repartidor.id_repartidor;
          document.body.removeChild(modal);
          AppUtils.showAlert('Repartidor creado exitosamente', 'success');
        } else {
          AppUtils.showAlert('Error al crear repartidor', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        AppUtils.showAlert('Error al crear repartidor', 'error');
      }
    });
  }

  // ========================================
  // PANELES COLAPSIBLES
  // ========================================

  const btnToggleProductoGenerico = document.getElementById('btnToggleProductoGenerico');
  const btnTogglePresentacion = document.getElementById('btnTogglePresentacion');
  const panelProductoGenerico = document.getElementById('panelProductoGenerico');
  const panelPresentacion = document.getElementById('panelPresentacion');

  btnToggleProductoGenerico.addEventListener('click', function() {
    panelProductoGenerico.classList.toggle('hidden');
    const chevron = this.querySelector('svg');
    chevron.classList.toggle('rotate-180');
  });

  btnTogglePresentacion.addEventListener('click', function() {
    panelPresentacion.classList.toggle('hidden');
    const chevron = this.querySelector('svg');
    chevron.classList.toggle('rotate-180');
  });


  // ========================================
  // FUNCIONALIDAD DE PRODUCTOS
  // ========================================

  function renumerarProductos() {
    const productos = document.querySelectorAll('[id^="producto-"]');
    
    productos.forEach((producto, index) => {
      const numeroProducto = index + 1;
      
      // Actualizar el título del producto
      const titulo = producto.querySelector('.producto-titulo');
      if (titulo) {
        titulo.textContent = `Producto ${numeroProducto}`;
      }
      
      // Actualizar los atributos name de los inputs para que tengan índices secuenciales
      const inputs = producto.querySelectorAll('input[name*="productos["], textarea[name*="productos["]');
      inputs.forEach(input => {
        const currentName = input.getAttribute('name');
        if (currentName) {
          // Reemplazar el índice anterior con el nuevo índice secuencial
          const newName = currentName.replace(/productos\[\d+\]/, `productos[${index}]`);
          input.setAttribute('name', newName);
        }
      });
    });
  }

  // Función modificada para agregar fila de producto
  function agregarFilaProducto() {
    productCounter++;
    const listaProductos = document.getElementById('listaProductos');
    
    const filaProducto = document.createElement('div');
    filaProducto.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
    filaProducto.id = `producto-${productCounter}`;
    
    filaProducto.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-medium text-gray-900 producto-titulo">Producto ${productCounter}</h4>
        <button type="button" onclick="eliminarProducto(${productCounter})" class="text-red-600 hover:text-red-800">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Producto *</label>
          <div class="relative">
            <input type="text" 
                  id="buscarProducto-${productCounter}" 
                  placeholder="Buscar producto..." 
                  autocomplete="off"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <div id="sugerenciasProducto-${productCounter}" class="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 hidden max-h-60 overflow-y-auto"></div>
          </div>
        </div>
        
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Cantidad *</label>
          <input type="number" 
                id="cantidad-${productCounter}" 
                name="productos[${productCounter-1}][cantidad]"
                step="1" 
                min="0" 
                required 
                placeholder="0"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
        
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Precio Unitario *</label>
          <input type="number" 
                id="precioUnitario-${productCounter}" 
                name="productos[${productCounter-1}][precio_unitario]"
                step="0.01" 
                min="0" 
                required 
                placeholder="0.00"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
        
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Importe</label>
          <input type="number" 
                id="importe-${productCounter}" 
                step="0.01" 
                disabled 
                placeholder="0.00"
                class="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm">
        </div>
      </div>
      
      <div class="mb-4">
        <button type="button" 
                onclick="toggleDetallesProducto(${productCounter})" 
                class="flex items-center text-sm text-blue-600 hover:text-blue-800">
          <svg class="h-4 w-4 mr-1 transition-transform duration-200" id="chevronDetalles-${productCounter}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          Detalles adicionales
        </button>
      </div>
      
      <div id="detallesProducto-${productCounter}" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Nota</label>
          <textarea id="nota-${productCounter}" 
                    name="productos[${productCounter-1}][nota]"
                    rows="2" 
                    placeholder="Nota del producto..."
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
        </div>
        
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Fecha de Caducidad</label>
          <input type="date" 
                name="productos[${productCounter-1}][fecha_de_caducidad]"
                id="caducidad-${productCounter}"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
      </div>
      
      <input type="hidden" id="idProducto-${productCounter}" name="productos[${productCounter-1}][id_producto]">
      <input type="hidden" id="idUnidad-${productCounter}" name="productos[${productCounter-1}][id_unidad]">
      <input type="hidden" id="importeHidden-${productCounter}" name="productos[${productCounter-1}][importe]">
    `;
    
    listaProductos.appendChild(filaProducto);
    
    // IMPORTANTE: Renumerar después de agregar
    renumerarProductos();
    
    // Configurar búsqueda de productos
    configurarBusquedaProducto(productCounter);
    
    // Configurar cálculo de importe
    configurarCalculoImporte(productCounter);
  }

  // Función modificada para eliminar producto con renumeración inmediata
  window.eliminarProducto = function(counter) {
    const producto = document.getElementById(`producto-${counter}`);
    if (producto) {
      producto.remove();
      
      // CLAVE: Renumerar productos INMEDIATAMENTE después de eliminar
      renumerarProductos();
      
      // Recalcular totales
      calcularTotales();
    }
  };

  // Event listener para agregar producto
  document.getElementById('btnAgregarProducto').addEventListener('click', function() {
    agregarFilaProducto();
  });
    

  // Función auxiliar para actualizar la conversión (corregida)
  function actualizarConversionDisplay(uniqueId, cantidad) {
    const conversionDiv = document.getElementById(`conversion-${uniqueId}`);
    const productoIdInput = document.getElementById(`idProducto-${uniqueId}`);
    
    if (!conversionDiv || !productoIdInput.value) return;
    
    // Aquí necesitarías acceso a los datos del producto seleccionado
    // Por simplicidad, mantengo la funcionalidad existente
    if (cantidad > 0) {
      conversionDiv.textContent = `= ${cantidad} unidades serán agregadas al stock`;
      conversionDiv.style.display = 'block';
    } else {
      conversionDiv.style.display = 'none';
    }
  }

  // Función mejorada para configurar cálculo de importe
  function configurarCalculoImporte(uniqueId) {
    const cantidadInput = document.getElementById(`cantidad-${uniqueId}`);
    const precioInput = document.getElementById(`precioUnitario-${uniqueId}`);
    const importeInput = document.getElementById(`importe-${uniqueId}`);
    const importeHidden = document.getElementById(`importeHidden-${uniqueId}`);

    function calcularImporte() {
      const cantidad = parseFloat(cantidadInput.value) || 0;
      const precio = parseFloat(precioInput.value) || 0;
      const importe = cantidad * precio;
      importeInput.value = importe.toFixed(2);
      importeHidden.value = importe.toFixed(2);
      calcularTotales();
      
      // Actualizar conversión si existe
      actualizarConversionDisplay(uniqueId, cantidad);
    }

    cantidadInput.addEventListener('input', calcularImporte);
    precioInput.addEventListener('input', calcularImporte);
  }
  function configurarBusquedaProducto(counter) {
    const input = document.getElementById(`buscarProducto-${counter}`);
    const sugerencias = document.getElementById(`sugerenciasProducto-${counter}`);
    let timeout;

    input.addEventListener('input', function() {
      clearTimeout(timeout);
      const query = this.value.trim();

      if (query.length < 2) {
        sugerencias.classList.add('hidden');
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const response = await fetch(`${API_PREFIX}/search-productos?q=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (data.success && data.productos.length > 0) {
            mostrarSugerenciasProducto(data.productos, counter);
          } else {
            sugerencias.classList.add('hidden');
          }
        } catch (error) {
          console.error('Error al buscar productos:', error);
        }
      }, 300);
    });
  }

  function mostrarSugerenciasProducto(productos, counter) {
    const sugerencias = document.getElementById(`sugerenciasProducto-${counter}`);
    sugerencias.innerHTML = '';
    
    productos.forEach(producto => {
      const div = document.createElement('div');
      div.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0';
      div.innerHTML = `
        <div class="font-medium text-gray-900">${producto.producto_display}</div>
        <div class="text-sm text-gray-500">Código: ${producto.codigo}</div>
      `;
      
      div.addEventListener('click', () => {
        seleccionarProducto(producto, counter);
      });
      
      sugerencias.appendChild(div);
    });
    
    sugerencias.classList.remove('hidden');
  }

  function seleccionarProducto(producto, counter) {
    const input = document.getElementById(`buscarProducto-${counter}`);
    const sugerencias = document.getElementById(`sugerenciasProducto-${counter}`);
    
    input.value = producto.producto_display;
    document.getElementById(`idProducto-${counter}`).value = producto.id_producto;
    document.getElementById(`idUnidad-${counter}`).value = producto.unidad_principal_id || '';
    sugerencias.classList.add('hidden');
    
    // NUEVO: Agregar información de conversión si existe cantidad_secundaria
    const cantidadInput = document.getElementById(`cantidad-${counter}`);
    
    // Crear o actualizar el div de conversión
    let conversionDiv = document.getElementById(`conversion-${counter}`);
    if (!conversionDiv) {
      conversionDiv = document.createElement('div');
      conversionDiv.id = `conversion-${counter}`;
      conversionDiv.className = 'text-xs text-blue-600 font-medium mt-1';
      cantidadInput.parentNode.appendChild(conversionDiv);
    }
    
    // Función para actualizar la conversión
    function actualizarConversion() {
      const cantidad = parseFloat(cantidadInput.value) || 0;
      const cantidadSecundaria = producto.cantidad_secundaria;
      
      if (cantidadSecundaria && cantidadSecundaria > 1 && cantidad > 0) {
        const unidadesBase = cantidad * cantidadSecundaria;
        conversionDiv.textContent = `= ${unidadesBase} ${producto.unidad_secundaria_abrev || 'unidades'} serán agregadas al stock`;
        conversionDiv.style.display = 'block';
      } else if (cantidad > 0) {
        conversionDiv.textContent = `= ${cantidad} unidades serán agregadas al stock`;
        conversionDiv.style.display = 'block';
      } else {
        conversionDiv.style.display = 'none';
      }
    }
    
    // Agregar listener para actualizar conversión en tiempo real
    cantidadInput.removeEventListener('input', actualizarConversion); // Evitar duplicados
    cantidadInput.addEventListener('input', actualizarConversion);
    
    // Actualizar conversión inicial
    actualizarConversion();
  }

  function configurarCalculoImporte(counter) {
    const cantidadInput = document.getElementById(`cantidad-${counter}`);
    const precioInput = document.getElementById(`precioUnitario-${counter}`);
    const importeInput = document.getElementById(`importe-${counter}`);
    const importeHidden = document.getElementById(`importeHidden-${counter}`);

    function calcularImporte() {
      const cantidad = parseFloat(cantidadInput.value) || 0;
      const precio = parseFloat(precioInput.value) || 0;
      const importe = cantidad * precio;
      importeInput.value = importe.toFixed(2);
      importeHidden.value = importe.toFixed(2);
      calcularTotales();
      
      // ✅ CORREGIDO: Llamar directamente a la función de actualización
      // en lugar de disparar un evento que cause recursión
      actualizarConversionDisplay(counter, cantidad);
    }

    cantidadInput.addEventListener('input', calcularImporte);
    precioInput.addEventListener('input', calcularImporte);
  }


  // ========================================
  // FUNCIONES GLOBALES

  window.toggleDetallesProducto = function(counter) {
    const detalles = document.getElementById(`detallesProducto-${counter}`);
    const chevron = document.getElementById(`chevronDetalles-${counter}`);
    
    detalles.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
  };

  function calcularTotales() {
    let subtotalCalculado = 0;
    
    // Sumar todos los importes
    /*document.querySelectorAll('[id^="importe-"]').forEach(input => {
      if (!input.disabled) {
        subtotalCalculado += parseFloat(input.value) || 0;
      }
    });*/
    document.querySelectorAll('[id^="importe-"]').forEach(input => {
      subtotalCalculado += parseFloat(input.value) || 0;
    });
    
    // Mostrar subtotal calculado
    document.getElementById('subtotalCalculado').textContent = subtotalCalculado.toFixed(2);
    
    // Calcular total
    const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
    const iva = parseFloat(document.getElementById('iva').value) || 0;
    const total = subtotal + iva;
    
    document.getElementById('total').value = total.toFixed(2);
  }

  // ========================================
  // EVENTOS DE TOTALES
  // ========================================

  document.getElementById('btnSugerirSubtotal').addEventListener('click', function() {
    const subtotalCalculado = parseFloat(document.getElementById('subtotalCalculado').textContent) || 0;
    document.getElementById('subtotal').value = subtotalCalculado.toFixed(2);
    calcularTotales();
  });

  document.getElementById('subtotal').addEventListener('input', calcularTotales);
  document.getElementById('iva').addEventListener('input', calcularTotales);

  // ========================================
  // VALIDACIÓN CONDICIONAL POR ESTATUS DE CAPTURA
  // ========================================

  // Configuración de campos requeridos por estatus
  const REQUIRED_FIELDS_BY_STATUS = {
    1: { // Incompleto
      name: 'incompleto',
      requiredFields: [
        { id: 'requisicion', name: 'Requisición de Entrada' },
        { id: 'proveedor', name: 'Proveedor' },
        { id: 'numeroFactura', name: 'Número de Factura' },
        { id: 'fechaFactura', name: 'Fecha de Emisión de Factura' },
        { id: 'tipoCompra', name: 'Tipo de Compra' },
        { id: 'partida', name: 'Partida Presupuestal' },
        { id: 'repartidor', name: 'Repartidor' },
        { id: 'productos', name: 'Al menos un producto' },
        { id: 'subtotal', name: 'Subtotal' },
        { id: 'iva', name: 'IVA' }
      ],
      message: 'Campos requeridos para "Incompleto":'
    },
    2: { // En Captura
      name: 'en_captura',
      requiredFields: [
        { id: 'requisicion', name: 'Requisición de Entrada' },
        { id: 'proveedor', name: 'Proveedor' },
        { id: 'repartidor', name: 'Repartidor' },
        { id: 'productos', name: 'Al menos un producto' },
        { id: 'subtotal', name: 'Subtotal' },
        { id: 'iva', name: 'IVA' }
      ],
      message: 'Campos requeridos para "En Captura":'
    },
    3: { // Capturado
      name: 'capturado',
      requiredFields: [
        { id: 'requisicion', name: 'Requisición de Entrada' },
        { id: 'proveedor', name: 'Proveedor' },
        { id: 'numeroFactura', name: 'Número de Factura' },
        { id: 'fechaFactura', name: 'Fecha de Emisión de Factura' },
        { id: 'tipoCompra', name: 'Tipo de Compra' },
        { id: 'partida', name: 'Partida Presupuestal' },
        { id: 'repartidor', name: 'Repartidor' },
        { id: 'productos', name: 'Al menos un producto' },
        { id: 'subtotal', name: 'Subtotal' },
        { id: 'iva', name: 'IVA' }
      ],
      message: 'Campos requeridos para "Capturado":'
    }
  };

  // Función para validar campos según estatus
  function validateFieldsByStatus() {
    const estatusSelect = document.getElementById('estatus');
    const selectedStatus = parseInt(estatusSelect.value);
    
    if (!selectedStatus || !REQUIRED_FIELDS_BY_STATUS[selectedStatus]) {
      return { valid: true, missingFields: [] };
    }
    
    const config = REQUIRED_FIELDS_BY_STATUS[selectedStatus];
    const missingFields = [];
    
    // Validar campos generales
    config.requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element) return;
      
      let isEmpty = false;
      
      if (element.tagName === 'SELECT') {
        isEmpty = !element.value || element.value === '';
      } else if (element.type === 'number') {
        isEmpty = element.value === '' || element.value === null || element.value === undefined || isNaN(parseFloat(element.value));
      } else {
        isEmpty = !element.value || element.value.trim() === '';
      }
      
      if (isEmpty) {
        missingFields.push(field.name);
        element.classList.add('border-red-500', 'bg-red-50');
      } else {
        element.classList.remove('border-red-500', 'bg-red-50');
      }
    });
    
    // Validar productos
    const productos = document.querySelectorAll('[id^="producto-"]');
    if (productos.length === 0) {
      missingFields.push('Al menos un producto');
    } else {
      let productosIncompletos = [];
      productos.forEach((producto, index) => {
        const counter = producto.id.split('-')[1];
        const idProducto = document.getElementById(`idProducto-${counter}`).value;
        const cantidad = document.getElementById(`cantidad-${counter}`).value;
        const precio = document.getElementById(`precioUnitario-${counter}`).value;
        
        if (!idProducto || !cantidad || !precio || parseFloat(cantidad) <= 0 || precio === '' || isNaN(parseFloat(precio))) {
          productosIncompletos.push(index + 1);
        }
      });
      
      if (productosIncompletos.length > 0) {
        missingFields.push(`Datos completos en producto(s): ${productosIncompletos.join(', ')}`);
      }
    }
    
    return {
      valid: missingFields.length === 0,
      missingFields: missingFields,
      statusConfig: config
    };
  }

  // Función para mostrar alerta de validación
  function showValidationAlert(missingFields, statusConfig) {
    const alertHtml = `
      <div id="validationAlert" class="fixed inset-0 bg-transparent overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 text-center mb-4">Campos obligatorios </h3>
            
            <div class="mb-4">
              <p class="text-sm text-red-600">
                ${missingFields.map(field => `• ${field}`).join(', ')}
              </p>
            </div>
            
            <div class="flex justify-center">
              <button type="button" id="closeValidationAlert" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const existingAlert = document.getElementById('validationAlert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    document.getElementById('closeValidationAlert').addEventListener('click', function() {
      document.getElementById('validationAlert').remove();
    });
  }

  // Función para mostrar información del estatus
  function showStatusInfo() {
    const estatusSelect = document.getElementById('estatus');
    const selectedStatus = parseInt(estatusSelect.value);
    
    const existingInfo = document.getElementById('statusInfo');
    if (existingInfo) {
      existingInfo.remove();
    }
    
    if (!selectedStatus || !REQUIRED_FIELDS_BY_STATUS[selectedStatus]) {
      return;
    }
    
    const config = REQUIRED_FIELDS_BY_STATUS[selectedStatus];
    let colorClass, bgClass, borderClass;

      colorClass = 'text-blue-800';
      bgClass = 'bg-blue-50';
      borderClass = 'border-blue-200';
    
    
    const infoHtml = `
      <div id="statusInfo" class="mt-3 p-3 ${bgClass} border ${borderClass} rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 ${colorClass}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm ${colorClass}">${config.message}</p>
            <div class="mt-2">
              <p class="text-xs ${colorClass} mt-1">
                ${config.requiredFields.map(field => `• ${field.name}`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    estatusSelect.parentNode.insertAdjacentHTML('beforeend', infoHtml);
  }

  // Función para limpiar estilos de error
  function clearErrorStyles() {
    document.querySelectorAll('.border-red-500, .bg-red-50').forEach(element => {
      element.classList.remove('border-red-500', 'bg-red-50');
    });
  }

  // Event listener para cambios en el estatus
  function setupStatusChangeListener() {
    const estatusSelect = document.getElementById('estatus');
    if (!estatusSelect) return;
    
    estatusSelect.addEventListener('change', function() {
      showStatusInfo();
      clearErrorStyles();
    });
  }

  // ========================================
  // VALIDACIÓN DEL FORMULARIO - MODIFICADA PARA INCLUIR VALIDACIÓN POR ESTATUS
  // ========================================

  document.getElementById('entryTicketForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // ✅ NUEVO: Limpiar campos problemáticos del panel de presentación antes de validar
    const panelPresentacion = document.getElementById('panelPresentacion');
    if (panelPresentacion && panelPresentacion.classList.contains('hidden')) {
      const unidadSecundariaSelect = document.getElementById('unidadSecundaria');
      if (unidadSecundariaSelect) {
        unidadSecundariaSelect.required = false;
        unidadSecundariaSelect.removeAttribute('required');
      }
    }
    
    // Limpiar estilos de error anteriores
    clearErrorStyles();
    
    // Resto de la validación existente...
    const validation = validateFieldsByStatus();
    
    if (!validation.valid) {
      showValidationAlert(validation.missingFields, validation.statusConfig);
      return;
    }

    // Validaciones originales...
    const productos = document.querySelectorAll('[id^="producto-"]');
    if (productos.length === 0) {
      AppUtils.showAlert('Debe agregar al menos un producto', 'error');
      return;
    }

    // Resto de validaciones...
    let productosValidos = true;
    productos.forEach((producto, index) => {
      const counter = producto.id.split('-')[1];
      const idProducto = document.getElementById(`idProducto-${counter}`).value;
      const cantidad = document.getElementById(`cantidad-${counter}`).value;
      const precio = document.getElementById(`precioUnitario-${counter}`).value;

      if (!idProducto || !cantidad || !precio) {
        productosValidos = false;
      }
    });

    if (!productosValidos) {
      AppUtils.showAlert('Todos los productos deben tener producto, cantidad y precio unitario', 'error');
      return;
    }

    if (!selectedProveedorId) {
      AppUtils.showAlert('Debe seleccionar un proveedor', 'error');
      return;
    }

    // Si todo está válido, enviar formulario
    this.submit();
  });

    
  // Variables para crear presentación
  let selectedProductoGenericoId = null;

  // ========================================
  // CREAR PRESENTACIÓN - FUNCIONALIDAD COMPLETA
  // ========================================

  // Configurar búsqueda de producto genérico para presentación
  const buscarProductoGenericoPres = document.getElementById('buscarProductoGenericoPres');
  const sugerenciasProductoGenerico = document.createElement('div');
  sugerenciasProductoGenerico.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 hidden max-h-60 overflow-y-auto';
  sugerenciasProductoGenerico.id = 'sugerenciasProductoGenerico';

  // Agregar el contenedor de sugerencias después del input
  buscarProductoGenericoPres.parentNode.style.position = 'relative';
  buscarProductoGenericoPres.parentNode.appendChild(sugerenciasProductoGenerico);

  let timeoutProductoGenerico;

  buscarProductoGenericoPres.addEventListener('input', function() {
    clearTimeout(timeoutProductoGenerico);
    const query = this.value.trim();

    if (query.length < 2) {
      sugerenciasProductoGenerico.classList.add('hidden');
      resetProductoGenerico();
      return;
    }

    timeoutProductoGenerico = setTimeout(async () => {
      try {
        const response = await fetch(`${API_PREFIX}/search-productos-genericos?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.productos.length > 0) {
          mostrarSugerenciasProductoGenerico(data.productos);
        } else {
          sugerenciasProductoGenerico.classList.add('hidden');
        }
      } catch (error) {
        console.error('Error al buscar productos genéricos:', error);
      }
    }, 300);
  });

  function mostrarSugerenciasProductoGenerico(productos) {
    sugerenciasProductoGenerico.innerHTML = '';
    
    productos.forEach(producto => {
      const div = document.createElement('div');
      div.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0';
      div.innerHTML = `
        <div class="font-medium text-gray-900">${producto.producto_generico}</div>
        <div class="text-sm text-gray-500">${producto.clave_objeto_del_gasto} - ${producto.partida}</div>
      `;
      
      div.addEventListener('click', () => {
        seleccionarProductoGenerico(producto);
      });
      
      sugerenciasProductoGenerico.appendChild(div);
    });
    
    sugerenciasProductoGenerico.classList.remove('hidden');
  }

  function seleccionarProductoGenerico(producto) {
    selectedProductoGenericoId = producto.id_producto_generico;
    buscarProductoGenericoPres.value = producto.display_text;
    sugerenciasProductoGenerico.classList.add('hidden');
  }

  function resetProductoGenerico() {
    selectedProductoGenericoId = null;
  }

  // Ocultar sugerencias al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!buscarProductoGenericoPres.contains(e.target) && !sugerenciasProductoGenerico.contains(e.target)) {
      sugerenciasProductoGenerico.classList.add('hidden');
    }
  });

  // Evento para crear presentación
  document.getElementById('btnCrearPresentacion').addEventListener('click', async function() {
    const codigo = document.getElementById('codigoProducto').value.trim();
    const unidadPrincipal = document.getElementById('unidadPrincipal').value;
    const cantidadSecundaria = document.getElementById('cantidadSecundaria').value;
    const unidadSecundaria = document.getElementById('unidadSecundaria').value;

    // Validaciones existentes...
    if (!selectedProductoGenericoId) {
      AppUtils.showAlert('Debe seleccionar un producto genérico', 'error');
      return;
    }

    if (!codigo || codigo.length < 2) {
      AppUtils.showAlert('Debe ingresar un código de al menos 2 caracteres', 'error');
      document.getElementById('codigoProducto').focus();
      return;
    }

    if (!unidadPrincipal) {
      AppUtils.showAlert('Debe seleccionar una unidad principal', 'error');
      return;
    }

    if (cantidadSecundaria && !unidadSecundaria) {
      AppUtils.showAlert('Si especifica cantidad secundaria, debe seleccionar unidad secundaria', 'error');
      return;
    }

    try {
      const presentacionData = {
        id_producto_generico: selectedProductoGenericoId,
        codigo: codigo,
        id_unidad: unidadPrincipal,
        cantidad_secundaria: cantidadSecundaria || null,
        id_unidad_secundaria: unidadSecundaria || null
      };

      const response = await fetch(`${API_PREFIX}/create-producto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presentacionData)
      });

      const data = await response.json();

      if (data.success) {
        // NUEVO: Limpiar COMPLETAMENTE el formulario y estados
        document.getElementById('buscarProductoGenericoPres').value = '';
        document.getElementById('codigoProducto').value = '';
        document.getElementById('unidadPrincipal').value = '';
        document.getElementById('cantidadSecundaria').value = '';
        
        // ✅ CLAVE: Limpiar y resetear unidadSecundaria COMPLETAMENTE
        const unidadSecundariaSelect = document.getElementById('unidadSecundaria');
        unidadSecundariaSelect.value = '';
        unidadSecundariaSelect.required = false;
        unidadSecundariaSelect.removeAttribute('required');
        
        // Resetear el label
        const label = unidadSecundariaSelect.parentNode.querySelector('label');
        if (label) {
          label.innerHTML = 'Unidad Secundaria';
        }
        
        selectedProductoGenericoId = null;
        
        // Ocultar sugerencias
        const sugerenciasProductoGenerico = document.getElementById('sugerenciasProductoGenerico');
        if (sugerenciasProductoGenerico) {
          sugerenciasProductoGenerico.classList.add('hidden');
        }
        
        // Cerrar y resetear panel
        const panel = document.getElementById('panelPresentacion');
        if (panel) {
          panel.classList.add('hidden');
        }
        
        const chevron = document.querySelector('#btnTogglePresentacion svg');
        if (chevron) {
          chevron.classList.remove('rotate-180');
        }
        
        AppUtils.showAlert('Presentación creada exitosamente', 'success');
      } else {
        AppUtils.showAlert(data.message || 'Error al crear presentación', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      AppUtils.showAlert('Error al crear presentación', 'error');
    }
  });

  // ========================================
  // VALIDACIONES ADICIONALES PARA PRESENTACIÓN
  // ========================================

  // Validar que si se ingresa cantidad secundaria, también se seleccione unidad secundaria
  document.getElementById('cantidadSecundaria').addEventListener('input', function() {
    const cantidadSecundaria = this.value;
    const unidadSecundariaSelect = document.getElementById('unidadSecundaria');
    
    if (cantidadSecundaria && cantidadSecundaria > 0) {
      unidadSecundariaSelect.required = true;
      unidadSecundariaSelect.parentNode.querySelector('label').innerHTML = 'Unidad Secundaria *';
    } else {
      unidadSecundariaSelect.required = false;
      unidadSecundariaSelect.parentNode.querySelector('label').innerHTML = 'Unidad Secundaria';
    }
  });

  // Limpiar cantidad secundaria si no se selecciona unidad secundaria
  document.getElementById('unidadSecundaria').addEventListener('change', function() {
    const cantidadSecundaria = document.getElementById('cantidadSecundaria');
    
    if (!this.value) {
      cantidadSecundaria.value = '';
    }
  });

  // Variables para búsqueda de productos similares
let timeoutProductoGenericoSimilar;
let productosGenericosSimilares = [];

// Configurar búsqueda en tiempo real para productos genéricos similares
const nuevoProductoGenericoInput = document.getElementById('nuevoProductoGenerico');
const sugerenciasProductoGenericoSimilar = document.createElement('div');
sugerenciasProductoGenericoSimilar.className = 'absolute z-10 w-full bg-white border border-purple-300 rounded-md shadow-lg mt-1 hidden max-h-48 overflow-y-auto';
sugerenciasProductoGenericoSimilar.id = 'sugerenciasProductoGenericoSimilar';

// Agregar contenedor de sugerencias
nuevoProductoGenericoInput.parentNode.style.position = 'relative';
nuevoProductoGenericoInput.parentNode.appendChild(sugerenciasProductoGenericoSimilar);

// Event listener para búsqueda de productos similares
nuevoProductoGenericoInput.addEventListener('input', function() {
  clearTimeout(timeoutProductoGenericoSimilar);
  const query = this.value.trim();

  if (query.length < 2) {
    sugerenciasProductoGenericoSimilar.classList.add('hidden');
    productosGenericosSimilares = [];
    return;
  }

  timeoutProductoGenericoSimilar = setTimeout(async () => {
    try {
      const response = await fetch(`${API_PREFIX}/search-similar-productos-genericos?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.productos.length > 0) {
        productosGenericosSimilares = data.productos;
        mostrarSugerenciasProductosGenericosSimilares(data.productos);
      } else {
        productosGenericosSimilares = [];
        sugerenciasProductoGenericoSimilar.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error al buscar productos genéricos similares:', error);
      productosGenericosSimilares = [];
    }
  }, 300);
});

// Mostrar productos similares (solo informativos, no seleccionables)
function mostrarSugerenciasProductosGenericosSimilares(productos) {
  sugerenciasProductoGenericoSimilar.innerHTML = '';
  
  // Header informativo
  const header = document.createElement('div');
  header.className = 'px-3 py-2 bg-purple-100 border-b border-purple-200 text-purple-800 text-xs font-medium';
  header.textContent = 'Productos genéricos existentes (solo informativo):';
  sugerenciasProductoGenericoSimilar.appendChild(header);
  
  productos.forEach(producto => {
    const div = document.createElement('div');
    
    if (producto.es_exacto) {
      // Producto exacto - resaltar en rojo
      div.className = 'px-3 py-2 bg-red-50 border-b border-red-200 cursor-not-allowed';
      div.innerHTML = `
        <div class="flex items-center">
          <svg class="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1">
            <div class="font-medium text-red-900">⚠️ ${producto.producto_generico}</div>
            <div class="text-xs text-red-700">${producto.clave_objeto_del_gasto} - ${producto.partida}</div>
            <div class="text-xs text-red-600 font-medium">Este nombre ya existe - No se puede duplicar</div>
          </div>
        </div>
      `;
    } else {
      // Producto similar - mostrar como informativo
      div.className = 'px-3 py-2 bg-purple-25 border-b border-purple-200 cursor-not-allowed';
      div.innerHTML = `
        <div class="flex items-center">
          <svg class="h-4 w-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1">
            <div class="font-medium text-purple-900">${producto.producto_generico}</div>
            <div class="text-xs text-purple-700">${producto.clave_objeto_del_gasto} - ${producto.partida}</div>
            <div class="text-xs text-purple-600">Existencia: ${producto.existencia} | Stock mín: ${producto.stock_min || 'N/A'}</div>
          </div>
        </div>
      `;
    }
    
    sugerenciasProductoGenericoSimilar.appendChild(div);
  });
  
  sugerenciasProductoGenericoSimilar.classList.remove('hidden');
}

// Ocultar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!nuevoProductoGenericoInput.contains(e.target) && !sugerenciasProductoGenericoSimilar.contains(e.target)) {
    sugerenciasProductoGenericoSimilar.classList.add('hidden');
  }
});

  // Botón crear producto genérico con validación mejorada
  document.getElementById('btnCrearProductoGenerico').addEventListener('click', async function() {
    const productoGenerico = document.getElementById('nuevoProductoGenerico').value.trim();
    const partidaId = document.getElementById('partidaProductoGenerico').value;
    const stockMin = document.getElementById('stockMinGenerico').value || 0;
    const stockSugerido = document.getElementById('stockSugeridoGenerico').value || 0;

    // Validaciones básicas
    if (!productoGenerico) {
      AppUtils.showAlert('El nombre del producto es requerido', 'error');
      return;
    }

    if (!partidaId) {
      AppUtils.showAlert('Debe seleccionar una partida', 'error');
      return;
    }

    // Validación de duplicados
    const productoExacto = productosGenericosSimilares.find(p => p.es_exacto);
    if (productoExacto) {
      AppUtils.showAlert(`Ya existe un producto genérico con el nombre "${productoExacto.producto_generico}". No se pueden crear productos duplicados.`, 'error');
      nuevoProductoGenericoInput.focus();
      return;
    }

    // Confirmación si hay productos similares
    const productosSimilares = productosGenericosSimilares.filter(p => !p.es_exacto);
    if (productosSimilares.length > 0) {
      const similares = productosSimilares.map(p => `• ${p.producto_generico}`).join('\n');
      const confirmar = confirm(
        `Se encontraron productos similares:\n\n${similares}\n\n¿Está seguro de que desea crear "${productoGenerico}" como un nuevo producto genérico?`
      );
      
      if (!confirmar) {
        return;
      }
    }

    try {
      // Mostrar loading
      const btnCrear = document.getElementById('btnCrearProductoGenerico');
      const textoOriginal = btnCrear.textContent;
      btnCrear.disabled = true;
      btnCrear.textContent = 'Creando...';

      const response = await fetch(`${API_PREFIX}/create-producto-generico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producto_generico: productoGenerico,
          id_partida: partidaId,
          stock_min: stockMin,
          stock_sugerido: stockSugerido
        })
      });

      const data = await response.json();

      if (data.success) {
        // Limpiar formulario
        document.getElementById('nuevoProductoGenerico').value = '';
        document.getElementById('partidaProductoGenerico').value = '';
        document.getElementById('stockMinGenerico').value = '';
        document.getElementById('stockSugeridoGenerico').value = '';
        
        // Limpiar sugerencias
        sugerenciasProductoGenericoSimilar.classList.add('hidden');
        productosGenericosSimilares = [];
        
        AppUtils.showAlert('Producto genérico creado exitosamente', 'success');
        panelProductoGenerico.classList.add('hidden');
        
        // Resetear chevron
        const chevron = document.querySelector('#btnToggleProductoGenerico svg');
        chevron.classList.remove('rotate-180');
      } else {
        AppUtils.showAlert(data.message || 'Error al crear producto genérico', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      AppUtils.showAlert('Error al crear producto genérico', 'error');
    } finally {
      // Restaurar botón
      const btnCrear = document.getElementById('btnCrearProductoGenerico');
      btnCrear.disabled = false;
      btnCrear.textContent = textoOriginal;
    }
  });

  // ========================================
  // CONFIGURAR AUTOCOMPLETADO DE REQUISICIONES
  // ========================================
  const requisicionInput = document.getElementById('requisicion');
  const requisicionSuggestions = document.getElementById('requisicionSuggestions');
  let requisicionSearchTimeout;

  if (requisicionInput && requisicionSuggestions) {
    // Búsqueda de requisiciones con debouncing
    requisicionInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      clearTimeout(requisicionSearchTimeout);
      
      if (query.length < 2) {
        requisicionSuggestions.classList.add('hidden');
        return;
      }

      requisicionSearchTimeout = setTimeout(() => {
        searchRequisiciones(query);
      }, 300);
    });

    // Función para buscar requisiciones
    async function searchRequisiciones(query) {
      try {
        const response = await fetch(`${API_PREFIX}/search/requisiciones?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.requisiciones && data.requisiciones.length > 0) {
          showRequisicionSuggestions(data.requisiciones);
        } else {
          requisicionSuggestions.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">No se encontraron requisiciones similares</div>';
          requisicionSuggestions.classList.remove('hidden');
          setTimeout(() => {
            requisicionSuggestions.classList.add('hidden');
          }, 3000);
        }
      } catch (error) {
        console.error('Error al buscar requisiciones:', error);
        requisicionSuggestions.innerHTML = '<div class="px-4 py-2 text-red-500 text-sm">Error en la búsqueda</div>';
        requisicionSuggestions.classList.remove('hidden');
        setTimeout(() => {
          requisicionSuggestions.classList.add('hidden');
        }, 3000);
      }
    }

    // Mostrar sugerencias de requisiciones
    function showRequisicionSuggestions(requisiciones) {
      requisicionSuggestions.innerHTML = '';
      
      requisiciones.forEach(req => {
        const div = document.createElement('div');
        div.className = 'px-4 py-3 cursor-pointer border-b border-gray-200 hover:bg-blue-50 transition-colors';
        div.innerHTML = `
          <div class="font-medium text-gray-900">${req.requisicion_de_entrada}</div>
          <div class="text-xs text-gray-500">Requisición existente</div>
        `;
        
        div.addEventListener('click', function() {
          requisicionInput.value = req.requisicion_de_entrada;
          requisicionSuggestions.classList.add('hidden');
          console.log('Requisición seleccionada:', req.requisicion_de_entrada);
        });
        
        requisicionSuggestions.appendChild(div);
      });
      
      requisicionSuggestions.classList.remove('hidden');
    }

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#requisicion') && !e.target.closest('#requisicionSuggestions')) {
        requisicionSuggestions.classList.add('hidden');
      }
    });

    console.log('Sistema de autocompletado de requisiciones inicializado');
  }
  // Inicializar validación por estatus
  setupStatusChangeListener();

  // Mostrar info inicial si hay un estatus seleccionado
  const estatusSelect = document.getElementById('estatus');
  if (estatusSelect && estatusSelect.value) {
    showStatusInfo();
  }
  // Inicializar con un producto por defecto
  agregarFilaProducto();
});