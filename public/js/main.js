/* ========================================
   PUBLIC/JS/MAIN.JS
   ======================================== */

// Funciones JavaScript principales para el sistema

document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de Almacén - Inicializado');
  
  // Inicializar funciones
  initializeFormValidation();
  initializeAlerts();
  initializeTooltips();
  
  // Agregar clase fade-in a elementos principales
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.classList.add('fade-in');
  }
  const toggleSistema = document.getElementById('toggleSistema');
  const sistemaContainer = document.getElementById('sistemaContainer');

  if (toggleSistema && sistemaContainer) {
    toggleSistema.addEventListener('click', () => {
      sistemaContainer.classList.toggle('hidden');
    });
  }
});

// Validación de formularios
function initializeFormValidation() {
  const loginForm = document.querySelector('form[action="/auth/login"]');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const usuario = document.getElementById('usuario');
      const clave = document.getElementById('contraseña');
      
      if (!usuario.value.trim()) {
        e.preventDefault();
        showAlert('El campo usuario es requerido', 'error');
        usuario.focus();
        return;
      }
      
      if (!contraseña.value.trim()) {
        e.preventDefault();
        showAlert('El campo contraseña es requerido', 'error');
        contraseña.focus();
        return;
      }
      
      // Mostrar spinner de carga
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner mr-2"></span>
          Iniciando sesión...
        `;
      }
    });
  }
}

function actualizarConversionDisplay(counter, cantidad) {
  const conversionDiv = document.getElementById(`conversion-${counter}`);
  if (!conversionDiv) return;
  
  // Buscar datos del producto seleccionado para este counter
  // (necesitarás almacenar estos datos cuando se selecciona el producto)
  const producto = obtenerDatosProductoSeleccionado(counter);
  
  if (producto && producto.cantidad_secundaria && producto.cantidad_secundaria > 1 && cantidad > 0) {
    const unidadesBase = cantidad * producto.cantidad_secundaria;
    conversionDiv.textContent = `= ${unidadesBase} ${producto.unidad_secundaria_abrev || 'unidades'} serán agregadas al stock`;
    conversionDiv.style.display = 'block';
  } else if (cantidad > 0) {
    conversionDiv.textContent = `= ${cantidad} unidades serán agregadas al stock`;
    conversionDiv.style.display = 'block';
  } else {
    conversionDiv.style.display = 'none';
  }
}

function seleccionarProducto(producto, counter) {
  const input = document.getElementById(`buscarProducto-${counter}`);
  const sugerencias = document.getElementById(`sugerenciasProducto-${counter}`);
  
  input.value = producto.producto_display;
  document.getElementById(`idProducto-${counter}`).value = producto.id_producto;
  document.getElementById(`idUnidad-${counter}`).value = producto.unidad_principal_id || '';
  sugerencias.classList.add('hidden');
  
  // ✅ ALMACENAR datos del producto para uso posterior
  input.dataset.productoData = JSON.stringify({
    cantidad_secundaria: producto.cantidad_secundaria,
    unidad_secundaria_abrev: producto.unidad_secundaria_abrev
  });
  
  // Crear div de conversión
  let conversionDiv = document.getElementById(`conversion-${counter}`);
  if (!conversionDiv) {
    conversionDiv = document.createElement('div');
    conversionDiv.id = `conversion-${counter}`;
    conversionDiv.className = 'text-xs text-blue-600 font-medium mt-1';
    document.getElementById(`cantidad-${counter}`).parentNode.appendChild(conversionDiv);
  }
  
  // Actualizar conversión inicial
  const cantidadActual = parseFloat(document.getElementById(`cantidad-${counter}`).value) || 0;
  actualizarConversionDisplay(counter, cantidadActual);
}

function obtenerDatosProductoSeleccionado(counter) {
  const input = document.getElementById(`buscarProducto-${counter}`);
  if (input && input.dataset.productoData) {
    return JSON.parse(input.dataset.productoData);
  }
  return null;
}

// Sistema de alertas
function initializeAlerts() {
  // Auto-ocultar alertas después de 5 segundos
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    }, 5000);
  });
}

// Mostrar alertas dinámicamente
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
  alertDiv.innerHTML = `
    <div class="flex items-center">
      <div class="flex-shrink-0">
        ${getAlertIcon(type)}
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <div class="ml-auto pl-3">
        <button class="close-alert text-gray-400 hover:text-gray-600">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Agregar evento de cierre
  const closeBtn = alertDiv.querySelector('.close-alert');
  closeBtn.addEventListener('click', () => {
    alertDiv.remove();
  });
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (alertDiv) {
      alertDiv.remove();
    }
  }, 5000);
}

// Iconos para alertas
function getAlertIcon(type) {
  const icons = {
    success: `<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>`,
    error: `<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`,
    warning: `<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>`,
    info: `<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
           </svg>`
  };
  
  return icons[type] || icons.info;
}

// Inicializar tooltips
function initializeTooltips() {
  const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
  
  elementsWithTooltip.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  });
}

// Mostrar tooltip
function showTooltip(e) {
  const element = e.target;
  const tooltipText = element.getAttribute('data-tooltip');
  
  const tooltip = document.createElement('div');
  tooltip.className = 'absolute bg-gray-900 text-white text-xs rounded py-1 px-2 z-50';
  tooltip.textContent = tooltipText;
  tooltip.id = 'tooltip';
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
  tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
}

// Ocultar tooltip
function hideTooltip() {
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Funciones de utilidad
function formatDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

// Confirmar acciones
function confirmAction(message, callback) {
  if (confirm(message)) {
    callback();
  }
}

// Logout con confirmación
function logout() {
  confirmAction('¿Estás seguro de que deseas cerrar sesión?', () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/auth/logout';
    document.body.appendChild(form);
    form.submit();
  });
}

// Función para manejar errores de red
function handleNetworkError(error) {
  console.error('Error de red:', error);
  showAlert('Error de conexión. Verifica tu conexión a internet.', 'error');
}

// Función para validar campos de entrada
function validateInput(input, rules) {
  const value = input.value.trim();
  const errors = [];
  
  if (rules.required && !value) {
    errors.push('Este campo es requerido');
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Debe tener al menos ${rules.minLength} caracteres`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`No debe exceder ${rules.maxLength} caracteres`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push('Formato inválido');
  }
  
  return errors;
}

// Función para mostrar/ocultar contraseña
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
}

// Exportar funciones para uso global
window.AppUtils = {
  showAlert,
  confirmAction,
  logout,
  formatDate,
  formatCurrency,
  validateInput,
  togglePasswordVisibility
};