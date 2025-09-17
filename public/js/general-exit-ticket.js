// ========================================
// PUBLIC/JS/EXIT-TICKET.JS - SISTEMA SEPARADO CON STOCK ESPECÍFICO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let productCounter = 0;
    const sistemaActual = document.body.getAttribute('data-sistema');

    // ========================================
    // CONFIGURACIÓN DE API PREFIX DINÁMICO
    // ========================================
    let API_PREFIX = '/exit-ticket/api';

    if (sistemaActual === 'GENERAL') {
        API_PREFIX = '/exit-ticket/general/api';
    } else if (sistemaActual === 'OFICIALIA') {
        API_PREFIX = '/exit-ticket/oficialia/api';
    }
    
    console.log('🚀 Exit Ticket JavaScript loaded - Sistema Separado');
    console.log('Sistema detectado:', sistemaActual);
    console.log('API Prefix configurado:', API_PREFIX);
    console.log('=== CONFIGURACIÓN COMPLETA ===');

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

    // ========================================
    // CONFIGURACIÓN DEL SISTEMA
    // ========================================
    const SystemConfig = {
        sistemaActivo: sistemaActual,
        esOficialia: sistemaActual === 'OFICIALIA',
        esAlmacenGeneral: sistemaActual === 'GENERAL',
        
        getSistemaTexto: function() {
            return this.esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL';
        }
    };

    console.log(`📋 Sistema: ${SystemConfig.getSistemaTexto()}`);

    // ========================================
    // HELPERS Y UTILIDADES
    // ========================================
    const ExitTicketHelpers = {
        formatNumber: function(num) {
            return new Intl.NumberFormat('es-MX').format(num);
        },
        
        validateQuantity: function(quantity, maxQuantity) {
            const qty = parseInt(quantity);
            return qty > 0 && qty <= maxQuantity;
        },
        
        getAvailableStock: function(product) {
            return SystemConfig.esOficialia ? 
                (product.existencia_oficialia || 0) : 
                (product.existencia_almacen_general || 0);
        },
        
        formatDateTime: function() {
            const now = new Date();
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'America/Mexico_City',
                hour12: false
            };
            return now.toLocaleString('es-MX', options);
        }
    };

    // ========================================
    // MANEJO DE PROVEEDORES
    // ========================================
    const ProveedorManager = {
        searchTimeout: null,

        setupProveedorSearch: function() {
            const proveedorSearch = document.getElementById('proveedorSearch');
            const proveedorSuggestions = document.querySelector('.proveedor-suggestions');
            const selectedProveedorId = document.getElementById('selectedProveedorId');

            if (proveedorSearch && proveedorSuggestions) {
                console.log('🏢 Configurando búsqueda de proveedores...');
                
                proveedorSearch.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    
                    clearTimeout(this.searchTimeout);
                    
                    if (query.length < 2) {
                        proveedorSuggestions.classList.add('hidden');
                        selectedProveedorId.value = '';
                        return;
                    }

                    this.searchTimeout = setTimeout(() => {
                        this.searchProveedores(query, proveedorSuggestions, selectedProveedorId, proveedorSearch);
                    }, 300);
                });

                // Cerrar sugerencias al hacer clic fuera
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('#proveedorSearch') && !e.target.closest('.proveedor-suggestions')) {
                        proveedorSuggestions.classList.add('hidden');
                    }
                });
            }
        },

        // Función para buscar proveedores - ACTUALIZADA CON API_PREFIX
        searchProveedores: async function(query, suggestionsContainer, hiddenInput, inputElement) {
            try {
                console.log(`🔍 Buscando proveedores: "${query}" en ${SystemConfig.getSistemaTexto()}`);
                
                const response = await fetch(`${API_PREFIX}/search/proveedores?q=${encodeURIComponent(query)}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success && data.proveedores && data.proveedores.length > 0) {
                    console.log(`✅ ${data.proveedores.length} proveedores encontrados`);
                    this.showProveedorSuggestions(data.proveedores, suggestionsContainer, hiddenInput, inputElement);
                } else {
                    console.log(`⚠️ No se encontraron proveedores para "${query}"`);
                    this.showNoProveedorResults(suggestionsContainer);
                }
            } catch (error) {
                console.error('❌ Error al buscar proveedores:', error);
                this.showProveedorError(suggestionsContainer, error.message);
            }
        },

        showProveedorSuggestions: function(proveedores, container, hiddenInput, inputElement) {
            container.innerHTML = '';
            
            proveedores.forEach(proveedor => {
                const div = document.createElement('div');
                div.className = 'px-4 py-3 cursor-pointer border-b border-gray-200 hover:bg-blue-50 transition-colors';
                
                div.innerHTML = `
                    <div class="font-medium text-gray-900">${proveedor.proveedor}</div>
                    <div class="text-sm text-gray-600">RFC: ${proveedor.rfc || 'N/A'}</div>
                    ${proveedor.domicilio ? `<div class="text-xs text-gray-500">${proveedor.domicilio}</div>` : ''}
                `;
                
                div.addEventListener('click', () => {
                    inputElement.value = proveedor.proveedor;
                    hiddenInput.value = proveedor.id_proveedor;
                    container.classList.add('hidden');
                    console.log(`✅ Proveedor seleccionado: ${proveedor.proveedor} (ID: ${proveedor.id_proveedor})`);
                });
                
                container.appendChild(div);
            });
            
            container.classList.remove('hidden');
        },

        showNoProveedorResults: function(container) {
            container.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">No se encontraron proveedores</div>';
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 3000);
        },

        showProveedorError: function(container, message) {
            container.innerHTML = `<div class="px-4 py-2 text-red-500 text-sm">Error: ${message}</div>`;
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 5000);
        }
    };

    // ========================================
    // MANEJO DE PRODUCTOS
    // ========================================
    const ProductManager = {
        searchTimeout: null,

        agregarFilaProducto: function() {
            productCounter++;
            const productRow = document.createElement('div');
            productRow.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 product-row-animation';
            productRow.setAttribute('data-product-id', productCounter);

            productRow.innerHTML = this.getProductRowHTML(productCounter);
            
            document.getElementById('listaProductos').appendChild(productRow);
            this.setupProductRowEvents(productRow, productCounter);
            
            console.log(`✅ Fila de producto #${productCounter} creada para ${SystemConfig.getSistemaTexto()}`);
        },

        getProductRowHTML: function(counter) {
            return `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Producto #${counter}</h3>
                    <button type="button" class="text-red-600 hover:text-red-800 remove-product">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Búsqueda de producto -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-gray-700">Producto *</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="buscarProducto-${counter}"
                                class="product-search block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                placeholder="Buscar producto..."
                                autocomplete="off"
                            >
                            <div id="sugerenciasProducto-${counter}" class="product-suggestions absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 hidden max-h-60 overflow-y-auto"></div>
                        </div>
                        <input type="hidden" id="idProducto-${counter}" name="productos[${counter}][id_producto]" required>
                        <input type="hidden" id="idUnidad-${counter}" name="productos[${counter}][id_unidad]" required>
                    </div>
                    
                    <!-- Cantidad -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-gray-700">Cantidad *</label>
                        <input 
                            type="number" 
                            id="cantidad-${counter}"
                            name="productos[${counter}][cantidad]"
                            class="product-quantity block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                            min="1" 
                            step="1" 
                            required
                            placeholder="1"
                        >
                        <div id="stockInfo-${counter}" class="text-xs text-gray-500 stock-info"></div>
                    </div>
                    
                    <!-- Tipo de Salida -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-gray-700">Tipo de Salida</label>
                        <div class="flex items-center space-x-4 mt-2">
                            <label class="flex items-center">
                                <input 
                                    type="radio" 
                                    name="productos[${counter}][tipo_salida]" 
                                    value="normal" 
                                    checked
                                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                >
                                <span class="ml-2 text-sm text-gray-700">Normal</span>
                            </label>
                            <label class="flex items-center">
                                <input 
                                    type="radio" 
                                    name="productos[${counter}][tipo_salida]" 
                                    value="merma" 
                                    class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                >
                                <span class="ml-2 text-sm text-red-700">Merma</span>
                            </label>
                        </div>
                        <input type="hidden" name="productos[${counter}][es_merma]" id="esMerma-${counter}" value="false">
                    </div>
                    
                    <!-- Nota -->
                    <div class="space-y-1">
                        <label class="block text-sm font-medium text-gray-700">Nota</label>
                        <input 
                            type="text" 
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                            name="productos[${counter}][nota]"
                            placeholder="Nota opcional..."
                        >
                    </div>
                </div>

                <!-- Información del producto - SIMPLIFICADA -->
                <div id="productInfo-${counter}" class="product-info mt-4 hidden">
                    <div class="bg-white rounded-md p-3 border border-gray-200">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="font-medium text-gray-700">Producto:</span>
                                <div class="product-name text-gray-900"></div>
                            </div>
                            <div>
                                <span class="font-medium ${SystemConfig.esOficialia ? 'text-purple-700' : 'text-green-700'}">Stock ${SystemConfig.getSistemaTexto()}:</span>
                                <div class="product-stock-actual ${SystemConfig.esOficialia ? 'text-purple-900' : 'text-green-900'} font-bold"></div>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Presentación:</span>
                                <div class="product-presentation text-gray-900"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        setupProductRowEvents: function(row, counter) {
            const productSearch = document.getElementById(`buscarProducto-${counter}`);
            const quantityInput = document.getElementById(`cantidad-${counter}`);
            const removeBtn = row.querySelector('.remove-product');
            const tipoSalidaRadios = row.querySelectorAll('input[name*="[tipo_salida]"]');
            const esMermaHidden = document.getElementById(`esMerma-${counter}`);

            // Búsqueda de productos
            productSearch.addEventListener('input', (e) => {
                this.handleProductSearch(e.target.value.trim(), counter);
            });

            // Validación de cantidad
            quantityInput.addEventListener('input', () => {
                this.validateQuantity(quantityInput, counter);
            });

            // Remover producto
            removeBtn.addEventListener('click', () => {
                row.remove();
                console.log('Producto removido');
            });

            // Tipo de salida (normal/merma)
            tipoSalidaRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    esMermaHidden.value = this.value === 'merma' ? 'true' : 'false';
                    console.log(`Producto marcado como: ${this.value.toUpperCase()}`);
                });
            });
        },

        handleProductSearch: function(query, counter) {
            console.log(`📝 Búsqueda en ${SystemConfig.getSistemaTexto()}: "${query}"`);
            
            clearTimeout(this.searchTimeout);
            
            if (query.length < 2) {
                document.getElementById(`sugerenciasProducto-${counter}`).classList.add('hidden');
                this.clearProductSelection(counter);
                return;
            }

            this.searchTimeout = setTimeout(() => {
                this.searchProductos(query, counter);
            }, 300);
        },

        clearProductSelection: function(counter) {
            const selectedProductId = document.getElementById(`idProducto-${counter}`);
            const selectedProductUnitId = document.getElementById(`idUnidad-${counter}`);
            const productInfo = document.getElementById(`productInfo-${counter}`);
            
            selectedProductId.value = '';
            selectedProductUnitId.value = '';
            productInfo.classList.add('hidden');
        },

        // Búsqueda de productos - ACTUALIZADA CON API_PREFIX
        async searchProductos(query, counter) {
            try {
                console.log(`🔍 Iniciando búsqueda para ${SystemConfig.getSistemaTexto()}: "${query}"`);
                
                const url = `${API_PREFIX}/search/productos?q=${encodeURIComponent(query)}`;
                console.log(`📡 URL de búsqueda: ${url}`);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`📦 Respuesta del servidor:`, data);
                
                if (data.success && data.productos && data.productos.length > 0) {
                    console.log(`✅ ${data.productos.length} productos encontrados para ${SystemConfig.getSistemaTexto()}`);
                    this.showProductSuggestions(data.productos, counter);
                } else {
                    console.log(`⚠️ Sin productos disponibles en ${SystemConfig.getSistemaTexto()} para "${query}"`);
                    this.showNoResults(counter);
                }
            } catch (error) {
                console.error('❌ Error al buscar productos:', error);
                this.showError(counter, error.message);
            }
        },

        // ========================================
        // SUGERENCIAS DE PRODUCTOS - SOLO STOCK DEL SISTEMA ACTUAL
        // ========================================
        showProductSuggestions: function(productos, counter) {
            const container = document.getElementById(`sugerenciasProducto-${counter}`);
            container.innerHTML = '';
            
            productos.forEach(producto => {
                const div = document.createElement('div');
                div.className = 'px-4 py-3 cursor-pointer border-b border-gray-200 transition-colors';
                
                // Solo mostrar el stock del sistema actual
                const stockActual = SystemConfig.esOficialia ? 
                    (producto.existencia_oficialia || 0) : 
                    (producto.existencia_almacen_general || 0);
                
                const stockDisponible = producto.stock_disponible || stockActual;
                const tieneStock = stockDisponible > 0;
                
                const sistemaActual = SystemConfig.getSistemaTexto();
                const colorSistema = SystemConfig.esOficialia ? 'purple' : 'green';
                
                div.innerHTML = `
                    <div class="font-medium text-gray-900">${producto.producto_generico}</div>
                    <div class="text-sm text-gray-600">Código: ${producto.codigo || 'N/A'}</div>
                    <div class="flex space-x-4 text-xs mt-1">
                        <span class="text-${colorSistema}-700 font-bold">📋 Stock: ${stockDisponible} ${producto.unidad_principal_abrev || ''}</span>
                    </div>
                    ${producto.cantidad_secundaria ? 
                        `<div class="text-xs text-purple-600 mt-1">1 ${producto.unidad_principal_abrev} = ${producto.cantidad_secundaria} ${producto.unidad_secundaria_abrev}</div>` 
                        : ''
                    }
                `;
                
                if (tieneStock) {
                    div.addEventListener('click', () => {
                        this.selectProduct(producto, counter);
                        container.classList.add('hidden');
                    });
                    div.classList.add('hover:bg-blue-50');
                } else {
                    div.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-50');
                    div.title = `Sin stock disponible en ${SystemConfig.getSistemaTexto()}`;
                }
                
                container.appendChild(div);
            });
            
            container.classList.remove('hidden');
        },

        showNoResults: function(counter) {
            const container = document.getElementById(`sugerenciasProducto-${counter}`);
            container.innerHTML = `<div class="px-4 py-2 text-gray-500 text-sm">No se encontraron productos con stock en ${SystemConfig.getSistemaTexto()}</div>`;
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 3000);
        },

        showError: function(counter, message) {
            const container = document.getElementById(`sugerenciasProducto-${counter}`);
            container.innerHTML = `<div class="px-4 py-2 text-red-500 text-sm">Error: ${message}</div>`;
            container.classList.remove('hidden');
            setTimeout(() => container.classList.add('hidden'), 5000);
        },

        selectProduct: function(producto, counter) {
            const productSearch = document.getElementById(`buscarProducto-${counter}`);
            const selectedProductId = document.getElementById(`idProducto-${counter}`);
            const selectedProductUnitId = document.getElementById(`idUnidad-${counter}`);
            const productInfo = document.getElementById(`productInfo-${counter}`);
            const quantityInput = document.getElementById(`cantidad-${counter}`);

            // Establecer valores
            productSearch.value = `${producto.producto_generico} (${producto.codigo})`;
            selectedProductId.value = producto.id_producto;
            selectedProductUnitId.value = producto.unidad_principal_id;

            // Almacenar datos del producto en el DOM
            productSearch.productData = producto;

            // Mostrar información del producto
            this.updateProductInfo(productInfo, producto);
            productInfo.classList.remove('hidden');

            // Validar cantidad actual
            this.validateQuantity(quantityInput, counter);
            
            console.log(`✅ Producto seleccionado para ${SystemConfig.getSistemaTexto()}: ${producto.producto_generico}`);
        },

        // ========================================
        // INFORMACIÓN DE PRODUCTO - SIMPLIFICADA
        // ========================================
        updateProductInfo: function(productInfo, producto) {
            productInfo.querySelector('.product-name').textContent = producto.producto_generico;
            
            // Solo mostrar el stock del sistema actual
            const stockActual = SystemConfig.esOficialia ? 
                (producto.existencia_oficialia || 0) : 
                (producto.existencia_almacen_general || 0);
            
            productInfo.querySelector('.product-stock-actual').textContent = `${stockActual} ${producto.unidad_principal_abrev}`;
            
            const presentationText = producto.cantidad_secundaria 
                ? `1 ${producto.unidad_principal_abrev} = ${producto.cantidad_secundaria} ${producto.unidad_secundaria_abrev}`
                : 'Presentación individual';
            productInfo.querySelector('.product-presentation').textContent = presentationText;
        },

        validateQuantity: function(quantityInput, counter) {
            const stockInfo = document.getElementById(`stockInfo-${counter}`);
            const productSearch = document.getElementById(`buscarProducto-${counter}`);
            const productData = productSearch.productData;
            
            if (!productData) {
                stockInfo.textContent = 'Seleccione un producto primero';
                stockInfo.className = 'text-xs text-gray-500 stock-info';
                return;
            }

            const currentQuantity = parseInt(quantityInput.value) || 0;
            const stockActual = SystemConfig.esOficialia ? 
                (productData.existencia_oficialia || 0) : 
                (productData.existencia_almacen_general || 0);
            const almacenTipo = SystemConfig.getSistemaTexto();
            
            console.log(`🔍 Validando cantidad para ${almacenTipo}:`, {
                cantidad: currentQuantity,
                stock_disponible: stockActual,
                es_oficialia: SystemConfig.esOficialia
            });
            
            if (currentQuantity > stockActual) {
                this.showQuantityError(stockInfo, quantityInput, almacenTipo, stockActual);
            } else if (currentQuantity > 0) {
                this.showQuantityValid(stockInfo, quantityInput, almacenTipo, stockActual);
            } else {
                this.showQuantityInfo(stockInfo, quantityInput, almacenTipo, stockActual);
            }
        },

        // ========================================
        // VALIDACIÓN DE CANTIDAD - SIMPLIFICADA
        // ========================================
        showQuantityError: function(stockInfo, quantityInput, almacenTipo, stockActual) {
            stockInfo.innerHTML = `
                <div class="text-red-600 font-medium">⚠️ Cantidad excede stock disponible</div>
                <div class="text-red-500">Disponible en ${almacenTipo}: ${stockActual}</div>
            `;
            stockInfo.className = 'text-xs stock-info p-2 bg-red-50 border border-red-200 rounded';
            quantityInput.classList.add('border-red-500');
        },

        showQuantityValid: function(stockInfo, quantityInput, almacenTipo, stockActual) {
            stockInfo.innerHTML = `
                <div class="text-green-600 font-medium">✓ Cantidad válida</div>
                <div class="text-green-500">Disponible en ${almacenTipo}: ${stockActual}</div>
            `;
            stockInfo.className = 'text-xs stock-info p-2 bg-green-50 border border-green-200 rounded';
            quantityInput.classList.remove('border-red-500');
        },

        showQuantityInfo: function(stockInfo, quantityInput, almacenTipo, stockActual) {
            stockInfo.innerHTML = `
                <div class="text-gray-600">Sistema activo: ${almacenTipo}</div>
                <div class="text-gray-500">Stock disponible: ${stockActual}</div>
            `;
            stockInfo.className = 'text-xs stock-info p-2 bg-gray-50 border border-gray-200 rounded';
            quantityInput.classList.remove('border-red-500');
        }
    };

    // ========================================
    // VALIDACIÓN DE FORMULARIO
    // ========================================
    const FormValidator = {
        validateForm: function() {
            const productos = document.querySelectorAll('#listaProductos > div');
            
            if (productos.length === 0) {
                AppUtils.showAlert('Debe agregar al menos un producto al vale de salida.', 'error');
                return false;
            }

            // Validar productos
            for (let i = 0; i < productos.length; i++) {
                const row = productos[i];
                if (!this.validateProductRow(row, i + 1)) {
                    return false;
                }
            }

            // Validar empleados
            return this.validateEmployees();
        },

        validateProductRow: function(row, index) {
            const counter = row.getAttribute('data-product-id');
            const productId = document.getElementById(`idProducto-${counter}`).value;
            const quantity = document.getElementById(`cantidad-${counter}`).value;
            
            if (!productId || !quantity || parseInt(quantity) <= 0) {
                AppUtils.showAlert(`El producto #${index} debe tener información completa y cantidad válida.`, 'error');
                return false;
            }

            // Validar stock disponible
            const productSearch = document.getElementById(`buscarProducto-${counter}`);
            const productData = productSearch.productData;
            
            if (productData && quantity) {
                const stockActual = SystemConfig.esOficialia ? 
                    (productData.existencia_oficialia || 0) : 
                    (productData.existencia_almacen_general || 0);
                
                console.log(`🔍 Validación final producto #${index}:`, {
                    sistema: SystemConfig.getSistemaTexto(),
                    stock_disponible: stockActual,
                    cantidad_solicitada: parseInt(quantity)
                });
                
                if (parseInt(quantity) > stockActual) {
                    AppUtils.showAlert(`El producto #${index} excede el stock disponible. Disponible: ${stockActual}, Solicitado: ${quantity}`, 'error');
                    return false;
                }
            }

            return true;
        },

        validateEmployees: function() {
            const empleadoRecibeSelect = document.getElementById('empleadoRecibe');
            const empleadoRecibeValue = empleadoRecibeSelect ? empleadoRecibeSelect.value : '';
            
            if (!empleadoRecibeValue || empleadoRecibeValue === '' || isNaN(empleadoRecibeValue)) {
                AppUtils.showAlert('Debe seleccionar un empleado que recibe válido.', 'error');
                if (empleadoRecibeSelect) empleadoRecibeSelect.focus();
                return false;
            }

            return true;
        }
    };

    // ========================================
    // INICIALIZACIÓN PRINCIPAL
    // ========================================
    const ExitTicketApp = {
        init: function() {
            console.log('🚀 Vale de salida: Sistema separado iniciado');
            
            this.setupDateTime();
            this.setupEventListeners();
            this.setupGlobalEventListeners();
            
            ProveedorManager.setupProveedorSearch();
            
            // Agregar primera fila de producto
            ProductManager.agregarFilaProducto();
            
            console.log(`🎉 Sistema de ${SystemConfig.getSistemaTexto()} inicializado correctamente`);
        },

        setupDateTime: function() {
            const fechaSalidaInput = document.getElementById('fechaSalida');
            if (fechaSalidaInput) {
                fechaSalidaInput.value = ExitTicketHelpers.formatDateTime();
                console.log('✅ Fecha establecida');
            }
        },

        setupEventListeners: function() {
            // Botón agregar producto
            const btnAgregarProducto = document.getElementById('btnAgregarProducto');
            if (btnAgregarProducto) {
                btnAgregarProducto.addEventListener('click', () => {
                    ProductManager.agregarFilaProducto();
                });
            }
            
            // Validación del formulario
            const exitTicketForm = document.getElementById('exitTicketForm');
            if (exitTicketForm) {
                exitTicketForm.addEventListener('submit', (e) => {
                    if (!FormValidator.validateForm()) {
                        e.preventDefault();
                        return;
                    }
                    console.log(`✅ Formulario válido para ${SystemConfig.getSistemaTexto()}, enviando...`);
                });
            }
        },

        setupGlobalEventListeners: function() {
            // Cerrar sugerencias al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.product-search') && !e.target.closest('.product-suggestions')) {
                    document.querySelectorAll('.product-suggestions').forEach(suggestions => {
                        suggestions.classList.add('hidden');
                    });
                }
            });
        }
    };

    // ========================================
    // ESTILOS Y INICIALIZACIÓN
    // ========================================
    const StyleManager = {
        addStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .product-suggestions {
                    z-index: 1000;
                }
                
                .product-row-animation {
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // ========================================
    // INICIALIZACIÓN AUTOMÁTICA
    // ========================================
    StyleManager.addStyles();
    ExitTicketApp.init();
});