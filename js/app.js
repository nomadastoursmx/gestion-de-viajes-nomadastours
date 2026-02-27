// Global variables
        let trips = JSON.parse(localStorage.getItem('travelAgencyTrips')) || [];
        let globalClients = JSON.parse(localStorage.getItem('travelAgencyGlobalClients')) || [];
        let currentTripId = null;
        let currentClientId = null;
        let editingTrip = false;
        let editingClient = false;
        let editingGlobalClient = false;
        let whatsappImageData = null;
        let monthlyChart = null;
                let currentView = 'grid';
        let filteredTrips = [...trips];
        let currentTripClientsView = 'cards';
        let sortConfig = {
            field: 'name',
            order: 'asc'
        };

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            renderDashboard();
            renderGlobalClients();
            renderWhatsAppRecipients();
            populateFilterOptions();
            
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            
            document.getElementById('whatsappMessage').addEventListener('input', function() {
                const count = this.value.length;
                document.getElementById('charCount').textContent = count;
                updateMessagePreview();
            });
            
            document.getElementById('clientDiscount').addEventListener('input', function() {
                const trip = trips.find(t => t.id === currentTripId);
                if (!trip) return;
                
                const discount = parseFloat(this.value) || 0;
                const originalPrice = trip.price;
                const finalPrice = originalPrice * (1 - discount / 100);
                
                document.getElementById('clientFinalPrice').value = finalPrice.toFixed(2);
            });
        });

        // Data persistence functions
        function saveData() {
            localStorage.setItem('travelAgencyTrips', JSON.stringify(trips));
            localStorage.setItem('travelAgencyGlobalClients', JSON.stringify(globalClients));
            showNotification('Datos guardados exitosamente', 'success');
        }

        function loadData() {
            const savedTrips = localStorage.getItem('travelAgencyTrips');
            const savedGlobalClients = localStorage.getItem('travelAgencyGlobalClients');
            
            if (savedTrips) {
                trips = JSON.parse(savedTrips);
            }
            
            if (savedGlobalClients) {
                globalClients = JSON.parse(savedGlobalClients);
            }
            
            filteredTrips = [...trips];
        }

        // Utility functions
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function formatCurrency(amount) {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(amount);
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Notification system
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            
            let icon = '';
            if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
            if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
            if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
            
            notification.innerHTML = `${icon} ${message}`;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Navigation functions
        function showSection(sectionId) {
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => section.classList.remove('active'));
            
            document.getElementById(sectionId).classList.add('active');
            
            if (sectionId === 'dashboard') {
                renderDashboard();
            } else if (sectionId === 'clients') {
                renderGlobalClients();
            } else if (sectionId === 'whatsapp') {
                renderWhatsAppRecipients();
            } else if (sectionId === 'reports') {
                renderReports();
            } else if (sectionId === 'tripregistry') {
                renderTripRegistry();
            } else if (sectionId === 'quotations') {
                populateQuoteTripSelect();
                document.getElementById('quoteDate').value = new Date().toISOString().split('T')[0];
                updateQuotePreview();
            } else if (sectionId === 'tools') {
                // Tools section is static
            }
        }

        function setView(viewType) {
            currentView = viewType;
            
            const gridBtn = document.getElementById('gridViewBtn');
            const listBtn = document.getElementById('listViewBtn');
            const gridView = document.getElementById('tripsContainer');
            const listView = document.getElementById('tripsListContainer');
            const filterContainer = document.getElementById('filterContainer');
            
            if (viewType === 'grid') {
                gridBtn.classList.add('active');
                listBtn.classList.remove('active');
                gridView.style.display = 'grid';
                listView.classList.remove('active');
                filterContainer.classList.remove('active');
            } else {
                gridBtn.classList.remove('active');
                listBtn.classList.add('active');
                gridView.style.display = 'none';
                listView.classList.add('active');
            }
            
            if (viewType === 'grid') {
                renderTripsGrid();
            } else {
                renderTripsList();
            }
        }

        function toggleFilters() {
            const filterContainer = document.getElementById('filterContainer');
            const filterBtn = document.getElementById('filterToggleBtn');
            
            if (filterContainer.classList.contains('active')) {
                filterContainer.classList.remove('active');
                filterBtn.classList.remove('active');
            } else {
                filterContainer.classList.add('active');
                filterBtn.classList.add('active');
            }
        }

        function populateFilterOptions() {
            const destinationSelect = document.getElementById('filterDestination');
            const destinations = [...new Set(trips.map(trip => trip.destination))];
            
            destinationSelect.innerHTML = '<option value="">Todos los destinos</option>';
            destinations.forEach(destination => {
                const option = document.createElement('option');
                option.value = destination;
                option.textContent = destination;
                destinationSelect.appendChild(option);
            });
        }

        function applyFilters() {
            const destination = document.getElementById('filterDestination').value;
            const status = document.getElementById('filterStatus').value;
            const dateFrom = document.getElementById('filterDateFrom').value;
            const dateTo = document.getElementById('filterDateTo').value;
            const priceMin = parseFloat(document.getElementById('filterPriceMin').value) || 0;
            const priceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;
            
            filteredTrips = trips.filter(trip => {
                if (destination && trip.destination !== destination) return false;
                
                if (status) {
                    const isCompleted = status === 'completed';
                    if (trip.completed !== isCompleted) return false;
                }
                
                if (dateFrom && new Date(trip.startDate) < new Date(dateFrom)) return false;
                if (dateTo && new Date(trip.endDate) > new Date(dateTo)) return false;
                
                if (trip.price < priceMin || trip.price > priceMax) return false;
                
                return true;
            });
            
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            if (searchTerm) {
                filteredTrips = filteredTrips.filter(trip => {
                    const text = `${trip.name} ${trip.destination}`.toLowerCase();
                    return text.includes(searchTerm);
                });
            }
            
            applySorting();
        }

        function applySorting() {
            const sortBy = document.getElementById('sortBy').value;
            const sortOrder = document.getElementById('sortOrder').value;
            
            sortConfig.field = sortBy;
            sortConfig.order = sortOrder;
            
            filteredTrips.sort((a, b) => {
                let valueA, valueB;
                
                switch(sortBy) {
                    case 'name':
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                        break;
                    case 'destination':
                        valueA = a.destination.toLowerCase();
                        valueB = b.destination.toLowerCase();
                        break;
                    case 'startDate':
                        valueA = new Date(a.startDate);
                        valueB = new Date(b.startDate);
                        break;
                    case 'endDate':
                        valueA = new Date(a.endDate);
                        valueB = new Date(b.endDate);
                        break;
                    case 'price':
                        valueA = a.price;
                        valueB = b.price;
                        break;
                    case 'clients':
                        valueA = a.clients ? a.clients.length : 0;
                        valueB = b.clients ? b.clients.length : 0;
                        break;
                    case 'profit':
                        const profitA = calculateTripProfit(a);
                        const profitB = calculateTripProfit(b);
                        valueA = profitA;
                        valueB = profitB;
                        break;
                    default:
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                }
                
                if (valueA < valueB) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
                return 0;
            });
            
            if (currentView === 'grid') {
                renderTripsGrid();
            } else {
                renderTripsList();
            }
        }

        function calculateTripProfit(trip) {
            const totalPaid = trip.clients ? trip.clients.reduce((sum, client) => {
                return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
            }, 0) : 0;
            const totalExpenses = trip.expenses ? trip.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
            return totalPaid - totalExpenses;
        }

        function resetFilters() {
            document.getElementById('filterDestination').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterDateFrom').value = '';
            document.getElementById('filterDateTo').value = '';
            document.getElementById('filterPriceMin').value = '';
            document.getElementById('filterPriceMax').value = '';
            document.getElementById('sortBy').value = 'name';
            document.getElementById('sortOrder').value = 'asc';
            
            filteredTrips = [...trips];
            sortConfig = { field: 'name', order: 'asc' };
            
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            if (searchTerm) {
                filteredTrips = filteredTrips.filter(trip => {
                    const text = `${trip.name} ${trip.destination}`.toLowerCase();
                    return text.includes(searchTerm);
                });
            }
            
            if (currentView === 'grid') {
                renderTripsGrid();
            } else {
                renderTripsList();
            }
            
            showNotification('Filtros restablecidos', 'success');
        }

        function renderDashboard() {
            renderTripsGrid();
        }

        function renderSummaryCards() { /* removed */ }

        function renderTripsGrid() {
            const container = document.getElementById('tripsContainer');
            
            if (filteredTrips.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-suitcase-rolling"></i>
                        <h3>No hay viajes que coincidan con los filtros</h3>
                        <p>Intenta ajustar los filtros o crear un nuevo viaje</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredTrips.map(trip => {
                const clients = trip.clients || [];
                const clientsCount = clients.length;
                
                const totalExpected = clients.reduce((sum, client) => sum + (client.finalPrice || trip.price), 0);
                const totalPaid = clients.reduce((sum, client) => {
                    return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
                }, 0);
                const totalPending = totalExpected - totalPaid;
                const totalExpenses = trip.expenses ? trip.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
                const netProfit = totalPaid - totalExpenses;

                return `
                    <div class="trip-card">
                        <div class="trip-status">
                            ${trip.completed ? 
                                '<span class="status-badge completed"><i class="fas fa-check-circle"></i> Realizado</span>' : 
                                '<span class="status-badge pending"><i class="fas fa-clock"></i> Pendiente</span>'
                            }
                        </div>
                        
                        <div class="trip-header">
                            <div>
                                <div class="trip-title">${trip.name}</div>
                                <div class="trip-destination"><i class="fas fa-map-marker-alt"></i> ${trip.destination}</div>
                            </div>
                            <div class="trip-actions">
                                <button class="btn btn-small btn-secondary" onclick="editTrip('${trip.id}')" title="Editar viaje">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-small ${trip.completed ? 'btn-warning' : 'btn-success'}" onclick="toggleTripCompleted('${trip.id}')" title="${trip.completed ? 'Marcar como no realizado' : 'Marcar como realizado'}">
                                    <i class="fas ${trip.completed ? 'fa-undo' : 'fa-check'}"></i>
                                </button>
                                <button class="btn btn-small btn-danger" onclick="deleteTrip('${trip.id}')" title="Eliminar viaje">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="trip-details">
                            <div class="trip-dates">
                                <i class="fas fa-calendar"></i> 
                                ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}
                            </div>
                            <div class="trip-price">
                                <i class="fas fa-tag"></i> ${formatCurrency(trip.price)} por persona
                            </div>
                            ${trip.basePrice && trip.basePrice !== trip.price ? `
                                <div class="trip-price-with-tax">
                                    <span class="original-price">Precio base: ${formatCurrency(trip.basePrice)}</span><br>
                                    <i class="fas fa-receipt"></i> Incluye 16% de impuestos
                                </div>
                            ` : ''}
                            ${trip.description ? `<div class="trip-description">${trip.description}</div>` : ''}
                        </div>
                        
                        <div class="trip-financial-summary">
                            <h4><i class="fas fa-chart-line"></i> Resumen Financiero</h4>
                            <div class="trip-financial-row">
                                <span>Ingresos:</span>
                                <span>${formatCurrency(totalPaid)}</span>
                            </div>
                            <div class="trip-financial-row">
                                <span>Gastos:</span>
                                <span>${formatCurrency(totalExpenses)}</span>
                            </div>
                            <div class="trip-financial-row total">
                                <span>Ganancia Neta:</span>
                                <span style="color: ${netProfit >= 0 ? '#4CAF50' : '#f44336'}">${formatCurrency(netProfit)}</span>
                            </div>
                        </div>
                        
                        <div class="clients-section">
                            <div class="clients-header">
                                <h4><i class="fas fa-users"></i> Clientes (${clientsCount})</h4>
                                <div class="btn-group">
                                    <button class="btn btn-small btn-primary" onclick="addExistingClientToTrip('${trip.id}')" title="Agregar cliente existente">
                                        <i class="fas fa-user-plus"></i> Agregar
                                    </button>
                                    ${clientsCount > 0 ? `<button class="btn btn-small btn-whatsapp" onclick="shareClientsList('${trip.id}')" title="Comprimir lista de clientes">
                                        <i class="fab fa-whatsapp"></i> Compartir
                                    </button>` : ''}
                                    <button class="btn btn-small btn-primary" onclick="manageClients('${trip.id}')">
                                        Gestionar
                                    </button>
                                </div>
                            </div>
                            
                            ${clientsCount > 0 ? `
                                <div style="margin-bottom: 15px; padding: 12px; background: #f0f8ff; border-radius: 8px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span><strong>Total Recaudado:</strong></span>
                                        <span class="payment-complete">${formatCurrency(totalPaid)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span><strong>Total Esperado:</strong></span>
                                        <span>${formatCurrency(totalExpected)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span><strong>Pendiente:</strong></span>
                                        <span class="${totalPending > 0 ? 'payment-pending' : 'payment-complete'}">
                                            ${formatCurrency(totalPending)}
                                        </span>
                                    </div>
                                </div>
                                ${clients.slice(0, 3).map(client => {
                                    const clientPrice = client.finalPrice || trip.price;
                                    const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                    const clientPending = clientPrice - clientPaid;
                                    const hasDiscount = client.discount && client.discount > 0;

                                    return `
                                        <div class="client-item">
                                            <div class="client-name">${client.name}</div>
                                            <div class="client-payment">
                                                Precio: ${hasDiscount ? `<span style="text-decoration: line-through; color: #999;">${formatCurrency(trip.price)}</span> ` : ''}${formatCurrency(clientPrice)} | 
                                                Pagado: ${formatCurrency(clientPaid)} | 
                                                <span class="${clientPending > 0 ? 'payment-pending' : 'payment-complete'}">
                                                    Pendiente: ${formatCurrency(clientPending)}
                                                </span>
                                                ${client.food ? `<span style="color: #ff9800; margin-left: 5px;"><i class="fas fa-utensils"></i></span>` : ''}
                                                ${hasDiscount ? `<span style="color: #f44336; margin-left: 5px;"><i class="fas fa-tag"></i></span>` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${clientsCount > 3 ? `<div style="text-align: center; color: var(--gray); padding: 10px;">... y ${clientsCount - 3} más</div>` : ''}
                            ` : `
                                <div class="empty-state" style="padding: 30px 0;">
                                    <i class="fas fa-user-plus"></i>
                                    <p>No hay clientes registrados</p>
                                </div>
                            `}
                        </div>
                        
                        <div class="expenses-section">
                            <div class="expenses-header">
                                <h4><i class="fas fa-receipt"></i> Gastos (${trip.expenses ? trip.expenses.length : 0})</h4>
                                <button class="btn btn-small btn-warning" onclick="manageExpenses('${trip.id}')">
                                    Gestionar
                                </button>
                            </div>
                            
                            ${trip.expenses && trip.expenses.length > 0 ? `
                                ${trip.expenses.slice(0, 3).map(expense => `
                                    <div class="expense-item">
                                        <div>
                                            <div class="expense-description">${expense.description}</div>
                                            <div class="expense-category">${expense.category.replace('_', ' ').toUpperCase()}</div>
                                        </div>
                                        <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                                    </div>
                                `).join('')}
                                ${trip.expenses.length > 3 ? `<div style="text-align: center; color: var(--gray); padding: 10px;">... y ${trip.expenses.length - 3} gastos más</div>` : ''}
                            ` : `
                                <div class="empty-state" style="padding: 30px 0;">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <p>No hay gastos registrados</p>
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderTripsList() {
            const tableBody = document.getElementById('tripsTableBody');
            
            if (filteredTrips.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">
                            <div class="empty-state" style="padding: 0;">
                                <i class="fas fa-suitcase-rolling"></i>
                                <h3>No hay viajes que coincidan con los filtros</h3>
                                <p>Intenta ajustar los filtros o crear un nuevo viaje</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = filteredTrips.map(trip => {
                const clients = trip.clients || [];
                const clientsCount = clients.length;
                
                const totalPaid = clients.reduce((sum, client) => {
                    return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
                }, 0);
                const totalExpenses = trip.expenses ? trip.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
                const netProfit = totalPaid - totalExpenses;

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600;">${trip.name}</div>
                            ${trip.completed ? '<span class="status-badge completed" style="margin-top: 5px;"><i class="fas fa-check-circle"></i> Realizado</span>' : '<span class="status-badge pending" style="margin-top: 5px;"><i class="fas fa-clock"></i> Pendiente</span>'}
                        </td>
                        <td>${trip.destination}</td>
                        <td>${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</td>
                        <td>${formatCurrency(trip.price)}</td>
                        <td>
                            <span class="${trip.completed ? 'payment-complete' : 'payment-pending'}" style="font-weight: 600;">
                                ${trip.completed ? 'Realizado' : 'Pendiente'}
                            </span>
                        </td>
                        <td>${clientsCount}</td>
                        <td style="color: ${netProfit >= 0 ? '#4CAF50' : '#f44336'}; font-weight: 600;">
                            ${formatCurrency(netProfit)}
                        </td>
                        <td>
                            <div class="trip-list-actions">
                                <button class="btn btn-small btn-primary" onclick="editTrip('${trip.id}')" title="Editar viaje">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-small ${trip.completed ? 'btn-warning' : 'btn-success'}" onclick="toggleTripCompleted('${trip.id}')" title="${trip.completed ? 'Marcar como no realizado' : 'Marcar como realizado'}">
                                    <i class="fas ${trip.completed ? 'fa-undo' : 'fa-check'}"></i>
                                </button>
                                <button class="btn btn-small btn-primary" onclick="manageClients('${trip.id}')" title="Gestionar clientes">
                                    <i class="fas fa-users"></i>
                                </button>
                                <button class="btn btn-small btn-warning" onclick="manageExpenses('${trip.id}')" title="Gestionar gastos">
                                    <i class="fas fa-receipt"></i>
                                </button>
                                <button class="btn btn-small btn-danger" onclick="deleteTrip('${trip.id}')" title="Eliminar viaje">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function toggleTripCompleted(tripId) {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            trip.completed = !trip.completed;
            saveData();
            renderDashboard();
            showNotification(trip.completed ? 'Viaje marcado como realizado' : 'Viaje marcado como no realizado', 'success');
        }

        function renderGlobalClients() {
            const tableBody = document.getElementById('clientsTableBody');
            
            if (globalClients.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">
                            <div class="empty-state" style="padding: 0;">
                                <i class="fas fa-users"></i>
                                <h3>No hay clientes registrados</h3>
                                <p>Agrega el primer cliente haciendo clic en "Nuevo Cliente"</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = globalClients.map(client => `
                <tr>
                    <td>
                        ${client.photo ? `<img src="${client.photo}" alt="${client.name}" class="client-photo">` : '<i class="fas fa-user-circle" style="font-size: 2rem; color: #ddd;"></i>'}
                    </td>
                    <td>${client.name}</td>
                    <td>${client.phone}</td>
                    <td>${client.email || '-'}</td>
                    <td>${client.address || '-'}</td>
                    <td>${client.food ? '<i class="fas fa-check" style="color: #4CAF50;"></i>' : '<i class="fas fa-times" style="color: #f44336;"></i>'}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-small btn-secondary" onclick="editGlobalClient('${client.id}')" title="Editar cliente">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteGlobalClient('${client.id}')" title="Eliminar cliente">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function filterClients() {
            const searchTerm = document.getElementById('clientsSearchInput').value.toLowerCase();
            const rows = document.querySelectorAll('#clientsTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        function showNewGlobalClientModal() {
            editingGlobalClient = false;
            document.getElementById('globalClientModalTitle').textContent = 'Nuevo Cliente';
            document.getElementById('globalClientForm').reset();
            removeGlobalClientPhoto();
            document.getElementById('globalClientModal').style.display = 'block';
        }

        function editGlobalClient(clientId) {
            const client = globalClients.find(c => c.id === clientId);
            if (!client) return;

            editingGlobalClient = true;
            currentClientId = clientId;
            document.getElementById('globalClientModalTitle').textContent = 'Editar Cliente';
            
            document.getElementById('globalClientName').value = client.name;
            document.getElementById('globalClientPhone').value = client.phone;
            document.getElementById('globalClientEmail').value = client.email || '';
            document.getElementById('globalClientAddress').value = client.address || '';
            document.getElementById('globalClientFood').checked = client.food || false;
            document.getElementById('globalClientNotes').value = client.notes || '';
            
            if (client.photo) {
                document.getElementById('globalClientPhotoPreview').src = client.photo;
                document.getElementById('globalClientPhotoPreview').style.display = 'block';
                document.getElementById('removeGlobalPhotoBtn').style.display = 'inline-block';
            }
            
            document.getElementById('globalClientModal').style.display = 'block';
        }

        function deleteGlobalClient(clientId) {
            const client = globalClients.find(c => c.id === clientId);
            if (!client) return;

            if (confirm(`¿Estás seguro de que quieres eliminar a "${client.name}"?`)) {
                globalClients = globalClients.filter(c => c.id !== clientId);
                saveData();
                renderGlobalClients();
                showNotification('Cliente eliminado exitosamente', 'success');
            }
        }

        function closeGlobalClientModal() {
            document.getElementById('globalClientModal').style.display = 'none';
            document.getElementById('globalClientForm').reset();
            removeGlobalClientPhoto();
            currentClientId = null;
            editingGlobalClient = false;
        }

        function previewGlobalClientPhoto(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('globalClientPhotoPreview').src = e.target.result;
                    document.getElementById('globalClientPhotoPreview').style.display = 'block';
                    document.getElementById('removeGlobalPhotoBtn').style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        }

        function removeGlobalClientPhoto() {
            document.getElementById('globalClientPhotoPreview').style.display = 'none';
            document.getElementById('removeGlobalPhotoBtn').style.display = 'none';
            document.getElementById('globalClientPhoto').value = '';
        }

        document.getElementById('globalClientForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('globalClientName').value.trim(),
                phone: document.getElementById('globalClientPhone').value.trim(),
                email: document.getElementById('globalClientEmail').value.trim(),
                address: document.getElementById('globalClientAddress').value.trim(),
                food: document.getElementById('globalClientFood').checked,
                notes: document.getElementById('globalClientNotes').value.trim(),
                photo: document.getElementById('globalClientPhotoPreview').src || null
            };

            if (!formData.name || !formData.phone) {
                showNotification('El nombre y teléfono del cliente son requeridos', 'error');
                return;
            }

            const existingClient = globalClients.find(c => 
                c.name.toLowerCase() === formData.name.toLowerCase() && 
                (!editingGlobalClient || c.id !== currentClientId)
            );
            
            if (existingClient) {
                showNotification('Ya existe un cliente con ese nombre', 'error');
                return;
            }

            if (editingGlobalClient && currentClientId) {
                const clientIndex = globalClients.findIndex(c => c.id === currentClientId);
                if (clientIndex !== -1) {
                    globalClients[clientIndex] = { ...globalClients[clientIndex], ...formData };
                    showNotification('Cliente actualizado exitosamente', 'success');
                }
            } else {
                const newClient = {
                    id: generateId(),
                    ...formData,
                    createdAt: new Date().toISOString()
                };
                globalClients.push(newClient);
                showNotification('Cliente agregado exitosamente', 'success');
            }

            saveData();
            closeGlobalClientModal();
            renderGlobalClients();
        });

        function showNewTripModal() {
            editingTrip = false;
            document.getElementById('tripModalTitle').textContent = 'Nuevo Viaje';
            document.getElementById('tripForm').reset();
            document.getElementById('tripCatalogInfo').style.display = 'none';
            populateTripCatalogSelect();
            document.getElementById('tripModal').style.display = 'block';
        }

        function editTrip(tripId) {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            editingTrip = true;
            currentTripId = tripId;
            document.getElementById('tripModalTitle').textContent = 'Editar Viaje';
            
            document.getElementById('tripName').value = trip.name;
            document.getElementById('tripDestination').value = trip.destination;
            document.getElementById('tripStartDate').value = trip.startDate;
            document.getElementById('tripEndDate').value = trip.endDate;
            document.getElementById('tripBasePrice').value = trip.basePrice || trip.price;
            document.getElementById('tripPrice').value = trip.price;
            document.getElementById('tripDescription').value = trip.description || '';
            document.getElementById('tripImages').value = trip.images ? trip.images.join(', ') : '';
            document.getElementById('includeTax').checked = trip.basePrice && trip.basePrice !== trip.price;
            
            document.getElementById('tripModal').style.display = 'block';
        }

        function deleteTrip(tripId) {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            const clientsCount = trip.clients ? trip.clients.length : 0;
            const expensesCount = trip.expenses ? trip.expenses.length : 0;
            const confirmMessage = `¿Estás seguro de que quieres eliminar el viaje "${trip.name}"?\n\nEsto también eliminará ${clientsCount} cliente(s), ${expensesCount} gasto(s) y todos sus registros asociados.`;

            if (confirm(confirmMessage)) {
                trips = trips.filter(t => t.id !== tripId);
                saveData();
                renderDashboard();
                showNotification('Viaje eliminado exitosamente', 'success');
            }
        }

        function closeTripModal() {
            document.getElementById('tripModal').style.display = 'none';
            document.getElementById('tripForm').reset();
            document.getElementById('taxInfo').style.display = 'none';
            currentTripId = null;
            editingTrip = false;
        }

        function calculateTaxPrice() {
            const basePrice = parseFloat(document.getElementById('tripBasePrice').value) || 0;
            const includeTax = document.getElementById('includeTax').checked;
            const taxInfo = document.getElementById('taxInfo');
            const taxCalculation = document.getElementById('taxCalculation');
            const priceInput = document.getElementById('tripPrice');
            
            if (includeTax && basePrice > 0) {
                const tax = basePrice * 0.16;
                const finalPrice = basePrice + tax;
                
                priceInput.value = finalPrice.toFixed(2);
                taxCalculation.textContent = `IVA (16%): ${formatCurrency(tax)} | Precio final: ${formatCurrency(finalPrice)}`;
                taxInfo.style.display = 'flex';
            } else {
                priceInput.value = basePrice.toFixed(2);
                taxInfo.style.display = 'none';
            }
        }

        document.getElementById('tripForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const basePrice = parseFloat(document.getElementById('tripBasePrice').value) || 0;
            const formData = {
                name: document.getElementById('tripName').value.trim(),
                destination: document.getElementById('tripDestination').value.trim(),
                startDate: document.getElementById('tripStartDate').value,
                endDate: document.getElementById('tripEndDate').value,
                price: parseFloat(document.getElementById('tripPrice').value),
                basePrice: basePrice,
                description: document.getElementById('tripDescription').value.trim(),
                images: document.getElementById('tripImages').value.split(',').map(url => url.trim()).filter(url => url),
                completed: false
            };

            if (!formData.name || !formData.destination || !formData.startDate || !formData.endDate || !formData.price) {
                showNotification('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                showNotification('La fecha de inicio debe ser anterior o igual a la fecha de fin', 'error');
                return;
            }

            if (formData.price <= 0) {
                showNotification('El precio debe ser mayor que 0', 'error');
                return;
            }

            if (editingTrip && currentTripId) {
                const tripIndex = trips.findIndex(t => t.id === currentTripId);
                if (tripIndex !== -1) {
                    trips[tripIndex] = { ...trips[tripIndex], ...formData };
                    showNotification('Viaje actualizado exitosamente', 'success');
                }
            } else {
                const newTrip = {
                    id: generateId(),
                    ...formData,
                    clients: [],
                    expenses: [],
                    createdAt: new Date().toISOString()
                };
                trips.push(newTrip);
                showNotification('Viaje creado exitosamente', 'success');
            }

            saveData();
            closeTripModal();
            renderDashboard();
            populateFilterOptions();
        });

        function addExistingClientToTrip(tripId) {
            currentTripId = tripId;
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            document.getElementById('addExistingClientModal').style.display = 'block';
            renderExistingClientsTable();
        }

        function renderExistingClientsTable() {
            const tableBody = document.getElementById('existingClientsTableBody');
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;

            const availableClients = globalClients.filter(globalClient => 
                !trip.clients || !trip.clients.some(tripClient => tripClient.globalClientId === globalClient.id)
            );

            if (availableClients.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: var(--gray);">
                            <div class="empty-state" style="padding: 0;">
                                <i class="fas fa-users"></i>
                                <h3>No hay clientes disponibles para agregar</h3>
                                <p>Todos los clientes ya están registrados en este viaje</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = availableClients.map(client => `
                <tr>
                    <td>
                        ${client.photo ? `<img src="${client.photo}" alt="${client.name}" class="client-photo">` : '<i class="fas fa-user-circle" style="font-size: 2rem; color: #ddd;"></i>'}
                    </td>
                    <td>${client.name}</td>
                    <td>${client.phone}</td>
                    <td>${client.email || '-'}</td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="addClientToTrip('${client.id}')">
                            <i class="fas fa-plus"></i> Agregar
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function filterExistingClients() {
            const searchTerm = document.getElementById('existingClientSearch').value.toLowerCase();
            const rows = document.querySelectorAll('#existingClientsTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        function addClientToTrip(globalClientId) {
            const trip = trips.find(t => t.id === currentTripId);
            const globalClient = globalClients.find(c => c.id === globalClientId);
            
            if (!trip || !globalClient) return;

            if (trip.clients && trip.clients.some(c => c.globalClientId === globalClientId)) {
                showNotification('Este cliente ya está registrado en este viaje', 'warning');
                return;
            }

            const tripClient = {
                id: generateId(),
                globalClientId: globalClientId,
                name: globalClient.name,
                email: globalClient.email,
                phone: globalClient.phone,
                food: globalClient.food,
                notes: globalClient.notes,
                discount: 0,
                finalPrice: trip.price,
                payments: [],
                createdAt: new Date().toISOString()
            };

            if (!trip.clients) trip.clients = [];
            trip.clients.push(tripClient);

            saveData();
            closeAddExistingClientModal();
            renderClientsModal(trip);
            renderDashboard();
            showNotification(`Cliente "${globalClient.name}" agregado exitosamente al viaje`, 'success');
        }

        function closeAddExistingClientModal() {
            document.getElementById('addExistingClientModal').style.display = 'none';
            document.getElementById('existingClientSearch').value = '';
            currentTripId = null;
        }

        function manageClients(tripId) {
            currentTripId = tripId;
            currentTripClientsView = 'cards';
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            document.getElementById('clientsModalTitle').textContent = `Clientes - ${trip.name}`;
            renderClientsModal(trip);
            document.getElementById('clientsModal').style.display = 'block';
        }

        function renderClientsModal(trip) {
            const clientsContainer = document.getElementById('clientsContent');
            const clients = trip.clients || [];
            
            const totalExpected = clients.reduce((sum, client) => sum + (client.finalPrice || trip.price), 0);
            const totalPaid = clients.reduce((sum, client) => {
                return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
            }, 0);
            const totalPending = totalExpected - totalPaid;

            clientsContainer.innerHTML = `
                <div style="margin-bottom: 25px;">
                    <button class="btn btn-primary" onclick="showNewClientModal()">
                        <i class="fas fa-user-plus"></i> Agregar Nuevo Cliente
                    </button>
                    <button class="btn btn-secondary" onclick="addExistingClientToTrip('${trip.id}')" style="margin-left: 10px;">
                        <i class="fas fa-user-plus"></i> Agregar Cliente Existente
                    </button>
                    <button class="btn btn-secondary" onclick="toggleClientsView()" style="margin-left: 10px;">
                        <i class="fas fa-${currentTripClientsView === 'cards' ? 'list' : 'th'}"></i> 
                        Vista ${currentTripClientsView === 'cards' ? 'de Lista' : 'de Tarjetas'}
                    </button>
                </div>

                ${clients.length > 0 ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                        <h3 style="margin-bottom: 15px;"><i class="fas fa-calculator"></i> Resumen Financiero</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #4CAF50;">${formatCurrency(totalPaid)}</div>
                                <div style="color: var(--gray);">Total Recaudado</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #2196F3;">${formatCurrency(totalExpected)}</div>
                                <div style="color: var(--gray);">Total Esperado</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: ${totalPending > 0 ? '#f44336' : '#4CAF50'};">${formatCurrency(totalPending)}</div>
                                <div style="color: var(--gray);">Pendiente</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div id="clientsCardsView" style="${currentTripClientsView === 'cards' ? 'display: block;' : 'display: none;'}">
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${clients.length > 0 ? clients.map(client => {
                            const clientPrice = client.finalPrice || trip.price;
                            const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                            const clientPending = clientPrice - clientPaid;
                            const paymentCount = client.payments ? client.payments.length : 0;
                            const hasDiscount = client.discount && client.discount > 0;

                            return `
                                <div class="client-item" style="margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                        <div style="flex: 1;">
                                            <div class="client-name">${client.name}</div>
                                            ${client.email ? `<div style="color: var(--gray); font-size: 0.9rem;"><i class="fas fa-envelope"></i> ${client.email}</div>` : ''}
                                            ${client.phone ? `<div style="color: var(--gray); font-size: 0.9rem;"><i class="fas fa-phone"></i> ${client.phone}</div>` : ''}
                                            ${client.food ? `<div style="color: #ff9800; font-size: 0.9rem;"><i class="fas fa-utensils"></i> Requiere alimentos especiales</div>` : ''}
                                            ${hasDiscount ? `<div style="color: #f44336; font-size: 0.9rem;"><i class="fas fa-tag"></i> Descuento: ${client.discount}%</div>` : ''}
                                        </div>
                                        <div style="display: flex; gap: 5px;">
                                            <button class="btn btn-small btn-secondary" onclick="editClient('${client.id}')" title="Editar cliente">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-small btn-danger" onclick="deleteClient('${client.id}')" title="Eliminar cliente">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; align-items: center; margin-bottom: 12px;">
                                        <div>
                                            <small style="color: var(--gray);">Precio:</small><br>
                                            <span style="font-weight: bold; color: #2196F3;">
                                                ${hasDiscount ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9em;">${formatCurrency(trip.price)}</span> ` : ''}
                                                ${formatCurrency(clientPrice)}
                                            </span>
                                        </div>
                                        <div>
                                            <small style="color: var(--gray);">Pagado:</small><br>
                                            <span style="font-weight: bold; color: #4CAF50;">${formatCurrency(clientPaid)}</span>
                                        </div>
                                        <button class="btn btn-small btn-primary" onclick="showPaymentModal('${client.id}')">
                                            <i class="fas fa-plus"></i> Abono
                                        </button>
                                    </div>

                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <div>
                                            <small style="color: var(--gray);">Pendiente:</small><br>
                                            <span style="font-weight: bold; color: ${clientPending > 0 ? '#f44336' : '#4CAF50'};">${formatCurrency(clientPending)}</span>
                                        </div>
                                    </div>

                                    ${clientPending > 0 ? `
                                        <button class="btn btn-small btn-whatsapp" onclick="sendWhatsAppReminder('${client.id}')" style="width: 100%; margin-bottom: 12px;">
                                            <i class="fab fa-whatsapp"></i> Enviar Recordatorio
                                        </button>
                                    ` : ''}

                                    ${paymentCount > 0 ? `
                                        <div class="payment-history">
                                            <h5 style="margin-bottom: 10px; color: #555;">
                                                <i class="fas fa-history"></i> Historial de Pagos (${paymentCount})
                                            </h5>
                                            ${client.payments.slice(-3).reverse().map(payment => `
                                                <div class="payment-item">
                                                    <div>
                                                        <div style="font-weight: bold;">${formatCurrency(payment.amount)}</div>
                                                        <div style="font-size: 0.8rem; color: var(--gray);">
                                                            ${formatDate(payment.date)} | ${payment.method}
                                                            ${payment.reference ? ` | Ref: ${payment.reference}` : ''}
                                                        </div>
                                                    </div>
                                                    <button class="btn btn-small btn-danger" onclick="deletePayment('${client.id}', '${payment.id}')" title="Eliminar pago">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            `).join('')}
                                            ${paymentCount > 3 ? `<div style="text-align: center; color: var(--gray); padding: 5px;">... y ${paymentCount - 3} pagos más</div>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('') : `
                            <div class="empty-state" style="padding: 40px 0;">
                                <i class="fas fa-users"></i>
                                <h3>No hay clientes registrados</h3>
                                <p>Agrega clientes para comenzar a gestionar el viaje</p>
                            </div>
                        `}
                    </div>
                </div>

                <div class="clients-list-container ${currentTripClientsView === 'list' ? 'active' : ''}" id="clientsListView">
                    <table>
                        <thead>
                            <tr>
                                <th class="sortable" onclick="sortTripClients('name')">Nombre</th>
                                <th class="sortable" onclick="sortTripClients('email')">Email</th>
                                <th class="sortable" onclick="sortTripClients('phone')">Teléfono</th>
                                <th class="sortable" onclick="sortTripClients('price')">Precio</th>
                                <th class="sortable" onclick="sortTripClients('paid')">Pagado</th>
                                <th class="sortable" onclick="sortTripClients('pending')">Pendiente</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.length > 0 ? clients.map(client => {
                                const clientPrice = client.finalPrice || trip.price;
                                const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                const clientPending = clientPrice - clientPaid;
                                
                                let statusClass = 'paid';
                                let statusText = 'Pagado';
                                if (clientPending > 0) {
                                    if (clientPaid > 0) {
                                        statusClass = 'partial';
                                        statusText = 'Parcial';
                                    } else {
                                        statusClass = 'pending';
                                        statusText = 'Pendiente';
                                    }
                                }

                                return `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 600;">${client.name}</div>
                                            ${client.food ? '<div style="color: #ff9800; font-size: 0.8rem;"><i class="fas fa-utensils"></i> Alimentos</div>' : ''}
                                            ${client.discount && client.discount > 0 ? `<div style="color: #f44336; font-size: 0.8rem;"><i class="fas fa-tag"></i> ${client.discount}% dto.</div>` : ''}
                                        </td>
                                        <td>${client.email || '-'}</td>
                                        <td>${client.phone || '-'}</td>
                                        <td>${formatCurrency(clientPrice)}</td>
                                        <td>${formatCurrency(clientPaid)}</td>
                                        <td>${formatCurrency(clientPending)}</td>
                                        <td>
                                            <span class="client-status-badge ${statusClass}">
                                                ${statusText}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="client-list-actions">
                                                <button class="btn btn-small btn-primary" onclick="editClient('${client.id}')" title="Editar">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-small btn-success" onclick="showPaymentModal('${client.id}')" title="Agregar pago">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                                ${clientPending > 0 ? `
                                                    <button class="btn btn-small btn-whatsapp" onclick="sendWhatsAppReminder('${client.id}')" title="Enviar recordatorio">
                                                        <i class="fab fa-whatsapp"></i>
                                                    </button>
                                                ` : ''}
                                                <button class="btn btn-small btn-danger" onclick="deleteClient('${client.id}')" title="Eliminar">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">
                                        <div class="empty-state" style="padding: 0;">
                                            <i class="fas fa-users"></i>
                                            <h3>No hay clientes registrados</h3>
                                            <p>Agrega clientes para comenzar a gestionar el viaje</p>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function toggleClientsView() {
            currentTripClientsView = currentTripClientsView === 'cards' ? 'list' : 'cards';
            const trip = trips.find(t => t.id === currentTripId);
            if (trip) {
                renderClientsModal(trip);
            }
        }

        function sortTripClients(field) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            trip.clients.sort((a, b) => {
                let valueA, valueB;
                
                switch(field) {
                    case 'name':
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                        break;
                    case 'email':
                        valueA = a.email || '';
                        valueB = b.email || '';
                        break;
                    case 'phone':
                        valueA = a.phone || '';
                        valueB = b.phone || '';
                        break;
                    case 'price':
                        valueA = a.finalPrice || trip.price;
                        valueB = b.finalPrice || trip.price;
                        break;
                    case 'paid':
                        valueA = a.payments ? a.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        valueB = b.payments ? b.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        break;
                    case 'pending':
                        const priceA = a.finalPrice || trip.price;
                        const priceB = b.finalPrice || trip.price;
                        const paidA = a.payments ? a.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const paidB = b.payments ? b.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        valueA = priceA - paidA;
                        valueB = priceB - paidB;
                        break;
                    default:
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                }
                
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
                return 0;
            });
            
            renderClientsModal(trip);
        }

        function closeClientsModal() {
            document.getElementById('clientsModal').style.display = 'none';
            currentTripId = null;
            currentTripClientsView = 'cards';
        }

        function showNewClientModal() {
            editingClient = false;
            document.getElementById('clientFormModalTitle').textContent = 'Nuevo Cliente';
            document.getElementById('clientForm').reset();
            document.getElementById('clientDiscount').value = 0;
            document.getElementById('clientFinalPrice').value = '';
            
            const trip = trips.find(t => t.id === currentTripId);
            if (trip) {
                document.getElementById('clientFinalPrice').value = trip.price.toFixed(2);
            }
            
            document.getElementById('clientFormModal').style.display = 'block';
        }

        function editClient(clientId) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            const client = trip.clients.find(c => c.id === clientId);
            if (!client) return;

            editingClient = true;
            currentClientId = clientId;
            document.getElementById('clientFormModalTitle').textContent = 'Editar Cliente';
            
            document.getElementById('clientName').value = client.name;
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientPhone').value = client.phone || '';
            document.getElementById('clientDocument').value = client.document || '';
            document.getElementById('clientFood').checked = client.food || false;
            document.getElementById('clientNotes').value = client.notes || '';
            document.getElementById('clientDiscount').value = client.discount || 0;
            document.getElementById('clientFinalPrice').value = client.finalPrice || trip.price;
            
            document.getElementById('clientFormModal').style.display = 'block';
        }

        function deleteClient(clientId) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            const client = trip.clients.find(c => c.id === clientId);
            if (!client) return;

            if (confirm(`¿Estás seguro de que quieres eliminar a "${client.name}" del viaje?`)) {
                trip.clients = trip.clients.filter(c => c.id !== clientId);
                saveData();
                renderClientsModal(trip);
                renderDashboard();
                showNotification('Cliente eliminado exitosamente', 'success');
            }
        }

        function closeClientFormModal() {
            document.getElementById('clientFormModal').style.display = 'none';
            document.getElementById('clientForm').reset();
            currentClientId = null;
            editingClient = false;
        }

        document.getElementById('clientForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;

            const formData = {
                name: document.getElementById('clientName').value.trim(),
                email: document.getElementById('clientEmail').value.trim(),
                phone: document.getElementById('clientPhone').value.trim(),
                document: document.getElementById('clientDocument').value.trim(),
                food: document.getElementById('clientFood').checked,
                notes: document.getElementById('clientNotes').value.trim(),
                discount: parseFloat(document.getElementById('clientDiscount').value) || 0,
                finalPrice: parseFloat(document.getElementById('clientFinalPrice').value) || trip.price
            };

            if (!formData.name) {
                showNotification('El nombre del cliente es requerido', 'error');
                return;
            }

            if (editingClient && currentClientId) {
                const clientIndex = trip.clients.findIndex(c => c.id === currentClientId);
                if (clientIndex !== -1) {
                    trip.clients[clientIndex] = { ...trip.clients[clientIndex], ...formData };
                    showNotification('Cliente actualizado exitosamente', 'success');
                }
            } else {
                const newClient = {
                    id: generateId(),
                    ...formData,
                    payments: [],
                    createdAt: new Date().toISOString()
                };
                
                if (!trip.clients) trip.clients = [];
                trip.clients.push(newClient);
                showNotification('Cliente agregado exitosamente', 'success');
            }

            saveData();
            closeClientFormModal();
            renderClientsModal(trip);
            renderDashboard();
        });

        function showPaymentModal(clientId) {
            currentClientId = clientId;
            document.getElementById('paymentForm').reset();
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('paymentModal').style.display = 'block';
        }

        function closePaymentModal() {
            document.getElementById('paymentModal').style.display = 'none';
            document.getElementById('paymentForm').reset();
            currentClientId = null;
        }

        document.getElementById('paymentForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            const client = trip.clients.find(c => c.id === currentClientId);
            if (!client) return;

            const formData = {
                amount: parseFloat(document.getElementById('paymentAmount').value),
                date: document.getElementById('paymentDate').value,
                method: document.getElementById('paymentMethod').value,
                reference: document.getElementById('paymentReference').value.trim(),
                notes: document.getElementById('paymentNotes').value.trim()
            };

            if (!formData.amount || formData.amount <= 0) {
                showNotification('El monto del abono debe ser mayor que 0', 'error');
                return;
            }

            if (!formData.method) {
                showNotification('Selecciona un método de pago', 'error');
                return;
            }

            const newPayment = {
                id: generateId(),
                ...formData,
                createdAt: new Date().toISOString()
            };

            if (!client.payments) client.payments = [];
            client.payments.push(newPayment);

            saveData();
            closePaymentModal();
            renderClientsModal(trip);
            renderDashboard();
            showNotification('Abono registrado exitosamente', 'success');
        });

        function deletePayment(clientId, paymentId) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            const client = trip.clients.find(c => c.id === clientId);
            if (!client || !client.payments) return;

            const payment = client.payments.find(p => p.id === paymentId);
            if (!payment) return;

            if (confirm(`¿Estás seguro de que quieres eliminar este abono de ${formatCurrency(payment.amount)}?`)) {
                client.payments = client.payments.filter(p => p.id !== paymentId);
                saveData();
                renderClientsModal(trip);
                renderDashboard();
                showNotification('Abono eliminado exitosamente', 'success');
            }
        }

        function manageExpenses(tripId) {
            currentTripId = tripId;
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            document.getElementById('clientsModalTitle').textContent = `Gastos - ${trip.name}`;
            renderExpensesModal(trip);
            document.getElementById('clientsModal').style.display = 'block';
        }

        function renderExpensesModal(trip) {
            const expensesContainer = document.getElementById('clientsContent');
            const expenses = trip.expenses || [];
            
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

            expensesContainer.innerHTML = `
                <div style="margin-bottom: 25px;">
                    <button class="btn btn-warning" onclick="showExpenseModal()">
                        <i class="fas fa-plus"></i> Agregar Gasto
                    </button>
                </div>

                ${expenses.length > 0 ? `
                    <div style="background: #fff8e1; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                        <h3 style="margin-bottom: 15px;"><i class="fas fa-calculator"></i> Resumen de Gastos</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #ff9800;">${formatCurrency(totalExpenses)}</div>
                                <div style="color: var(--gray);">Total de Gastos</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #ff9800;">${expenses.length}</div>
                                <div style="color: var(--gray);">Número de Gastos</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div style="max-height: 400px; overflow-y: auto;">
                    ${expenses.length > 0 ? expenses.map(expense => `
                        <div class="expense-item" style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div style="flex: 1;">
                                    <div class="expense-description">${expense.description}</div>
                                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                                        <span class="expense-category">${expense.category.replace('_', ' ').toUpperCase()}</span>
                                        <span style="color: var(--gray); font-size: 0.9rem;"><i class="fas fa-calendar"></i> ${formatDate(expense.date)}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-small btn-danger" onclick="deleteExpense('${expense.id}')" title="Eliminar gasto">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <small style="color: var(--gray);">Monto:</small><br>
                                    <span style="font-weight: bold; color: #ff9800;">${formatCurrency(expense.amount)}</span>
                                </div>
                            </div>
                            ${expense.notes ? `
                                <div style="margin-top: 10px; padding: 8px; background: #f5f5f5; border-radius: 6px; font-size: 0.9rem; color: #555;">
                                    <i class="fas fa-sticky-note"></i> ${expense.notes}
                                </div>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <div class="empty-state" style="padding: 40px 0;">
                            <i class="fas fa-receipt"></i>
                            <h3>No hay gastos registrados</h3>
                            <p>Agrega gastos para llevar un control financiero del viaje</p>
                        </div>
                    `}
                </div>
            `;
        }

        function showExpenseModal() {
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('expenseModal').style.display = 'block';
        }

        function closeExpenseModal() {
            document.getElementById('expenseModal').style.display = 'none';
            document.getElementById('expenseForm').reset();
        }

        document.getElementById('expenseForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;

            const formData = {
                description: document.getElementById('expenseDescription').value.trim(),
                amount: parseFloat(document.getElementById('expenseAmount').value),
                date: document.getElementById('expenseDate').value,
                category: document.getElementById('expenseCategory').value,
                notes: document.getElementById('expenseNotes').value.trim()
            };

            if (!formData.description || !formData.amount || !formData.date || !formData.category) {
                showNotification('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            if (formData.amount <= 0) {
                showNotification('El monto del gasto debe ser mayor que 0', 'error');
                return;
            }

            const newExpense = {
                id: generateId(),
                ...formData,
                createdAt: new Date().toISOString()
            };

            if (!trip.expenses) trip.expenses = [];
            trip.expenses.push(newExpense);

            saveData();
            closeExpenseModal();
            renderExpensesModal(trip);
            renderDashboard();
            showNotification('Gasto registrado exitosamente', 'success');
        });

        function deleteExpense(expenseId) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.expenses) return;

            const expense = trip.expenses.find(e => e.id === expenseId);
            if (!expense) return;

            if (confirm(`¿Estás seguro de que quieres eliminar este gasto de "${expense.description}" por ${formatCurrency(expense.amount)}?`)) {
                trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
                saveData();
                renderExpensesModal(trip);
                renderDashboard();
                showNotification('Gasto eliminado exitosamente', 'success');
            }
        }

        function renderWhatsAppRecipients() {
            const recipientsList = document.getElementById('whatsappRecipientsList');
            
            if (globalClients.length === 0) {
                recipientsList.innerHTML = `
                    <div class="empty-state" style="padding: 30px 0;">
                        <i class="fas fa-users"></i>
                        <h3>No hay clientes registrados</h3>
                        <p>Agrega clientes en la sección de "Gestión de Clientes"</p>
                    </div>
                `;
                return;
            }

            recipientsList.innerHTML = globalClients.map(client => `
                <div class="recipient-item">
                    <input type="checkbox" class="recipient-checkbox" id="recipient-${client.id}" value="${client.id}" onchange="updateSelectedCount()">
                    <div class="recipient-info">
                        <div class="recipient-name">${client.name}</div>
                        <div class="recipient-phone">${client.phone}</div>
                    </div>
                </div>
            `).join('');
        }

        function toggleAllClients() {
            const selectAll = document.getElementById('selectAllClients').checked;
            const checkboxes = document.querySelectorAll('.recipient-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll;
            });
            
            updateSelectedCount();
        }

        function updateSelectedCount() {
            const checkboxes = document.querySelectorAll('.recipient-checkbox');
            const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            document.getElementById('selectedCount').textContent = `${selectedCount} seleccionados`;
            
            const sendButton = document.getElementById('sendWhatsAppBtn');
            const message = document.getElementById('whatsappMessage').value.trim();
            
            sendButton.disabled = selectedCount === 0 || !message;
        }

        function updateMessagePreview() {
            const message = document.getElementById('whatsappMessage').value.trim();
            const preview = document.getElementById('messagePreview');
            
            if (message) {
                preview.textContent = message;
            } else {
                preview.textContent = 'Escribe un mensaje para ver la vista previa...';
            }
            
            updateSelectedCount();
        }

        function previewWhatsAppImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('whatsappImagePreview').src = e.target.result;
                    document.getElementById('whatsappImagePreview').style.display = 'block';
                    document.getElementById('removeImageBtn').style.display = 'inline-block';
                    
                    whatsappImageData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        function removeWhatsAppImage() {
            document.getElementById('whatsappImagePreview').style.display = 'none';
            document.getElementById('removeImageBtn').style.display = 'none';
            document.getElementById('whatsappImage').value = '';
            whatsappImageData = null;
        }

        function sendWhatsAppMessages() {
            const message = document.getElementById('whatsappMessage').value.trim();
            
            if (!message) {
                showNotification('Por favor escribe un mensaje', 'error');
                return;
            }
            
            const checkboxes = document.querySelectorAll('.recipient-checkbox:checked');
            
            if (checkboxes.length === 0) {
                showNotification('Por favor selecciona al menos un destinatario', 'error');
                return;
            }
            
            const selectedClients = Array.from(checkboxes).map(checkbox => {
                const clientId = checkbox.value;
                return globalClients.find(client => client.id === clientId);
            }).filter(client => client);
            
            let currentIndex = 0;
            
            function sendNextMessage() {
                if (currentIndex >= selectedClients.length) {
                    showNotification(`Se abrieron ${selectedClients.length} conversaciones de WhatsApp`, 'success');
                    
                    document.getElementById('whatsappMessage').value = '';
                    document.getElementById('charCount').textContent = '0';
                    removeWhatsAppImage();
                    updateMessagePreview();
                    
                    document.getElementById('selectAllClients').checked = false;
                    toggleAllClients();
                    
                    return;
                }
                
                const client = selectedClients[currentIndex];
                
                let phoneNumber = client.phone.replace(/\D/g, '');
                
                if (phoneNumber.length === 10) {
                    phoneNumber = '52' + phoneNumber;
                }
                
                let whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                
                window.open(whatsappUrl, '_blank');
                
                if (whatsappImageData) {
                    setTimeout(() => {
                        showNotification(`Por favor adjunta la imagen manualmente en la conversación con ${client.name}`, 'warning');
                    }, 1000);
                }
                
                currentIndex++;
                
                setTimeout(sendNextMessage, 2000);
            }
            
            sendNextMessage();
        }

        function sendWhatsAppReminder(clientId) {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip || !trip.clients) return;

            const client = trip.clients.find(c => c.id === clientId);
            if (!client) return;

            const clientPrice = client.finalPrice || trip.price;
            const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
            const clientPending = clientPrice - clientPaid;

            if (clientPending <= 0) {
                showNotification('Este cliente no tiene pagos pendientes', 'warning');
                return;
            }

            const reminderMessage = `Hola ${client.name.split(' ')[0]}, este es un recordatorio amable de Nómadas Tours sobre tu pago pendiente de ${formatCurrency(clientPending)} para el viaje "${trip.name}".\n\nFecha del viaje: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nDestino: ${trip.destination}\n\nSi tienes alguna pregunta o necesitas más información, no dudes en contactarnos. ¡Gracias por tu preferencia!`;

            let phoneNumber = client.phone.replace(/\D/g, '');
            
            if (phoneNumber.length === 10) {
                phoneNumber = '52' + phoneNumber;
            }
            
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(reminderMessage)}`;
            
            window.open(whatsappUrl, '_blank');
            
            showNotification('Se abrió WhatsApp con el recordatorio de pago', 'success');
        }

        function shareClientsList(tripId) {
            const trip = trips.find(t => t.id === tripId);
            if (!trip || !trip.clients || trip.clients.length === 0) return;

            let clientsList = `Lista de clientes para el viaje "${trip.name}"\n\n`;
            clientsList += `Destino: ${trip.destination}\n`;
            clientsList += `Fechas: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n\n`;
            
            trip.clients.forEach((client, index) => {
                clientsList += `${index + 1}. ${client.name}\n`;
                if (client.phone) clientsList += `   Tel: ${client.phone}\n`;
                if (client.email) clientsList += `   Email: ${client.email}\n`;
                
                const clientPrice = client.finalPrice || trip.price;
                const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                const clientPending = clientPrice - clientPaid;
                
                clientsList += `   Precio: ${formatCurrency(clientPrice)}\n`;
                clientsList += `   Pagado: ${formatCurrency(clientPaid)}\n`;
                clientsList += `   Pendiente: ${formatCurrency(clientPending)}\n`;
                
                if (client.food) clientsList += `   Requiere alimentos especiales\n`;
                if (client.discount && client.discount > 0) clientsList += `   Descuento aplicado: ${client.discount}%\n`;
                
                clientsList += `\n`;
            });
            
            clientsList += `Total de clientes: ${trip.clients.length}\n`;
            
            const totalPaid = trip.clients.reduce((sum, client) => {
                return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
            }, 0);
            const totalExpected = trip.clients.reduce((sum, client) => sum + (client.finalPrice || trip.price), 0);
            const totalPending = totalExpected - totalPaid;
            
            clientsList += `Total recaudado: ${formatCurrency(totalPaid)}\n`;
            clientsList += `Total esperado: ${formatCurrency(totalExpected)}\n`;
            clientsList += `Total pendiente: ${formatCurrency(totalPending)}\n\n`;
            clientsList += `Generado por Nómadas Tours - Sistema de Gestión`;

            const textarea = document.createElement('textarea');
            textarea.value = clientsList;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            showNotification('Lista de clientes copiada al portapapeles', 'success');
        }

        function renderReports() {
            updateReport();
        }

        function updateReport() {
            const reportsContainer = document.getElementById('reportsContent');
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;

            let fTrips = trips;
            if (startDate || endDate) {
                fTrips = trips.filter(t => {
                    const ts = new Date(t.startDate), te = new Date(t.endDate);
                    if (startDate && endDate) return ts >= new Date(startDate) && te <= new Date(endDate);
                    if (startDate) return ts >= new Date(startDate);
                    return te <= new Date(endDate);
                });
            }

            // --- KPIs ---
            const totalTrips = fTrips.length;
            const completedTrips = fTrips.filter(t => t.completed).length;
            const totalClients = fTrips.reduce((s,t) => s + (t.clients||[]).length, 0);
            const totalRevenue = fTrips.reduce((s,t) => s + (t.clients||[]).reduce((cs,c) => cs + (c.payments||[]).reduce((ps,p) => ps+p.amount, 0), 0), 0);
            const totalExpenses = fTrips.reduce((s,t) => s + (t.expenses||[]).reduce((es,e) => es+e.amount, 0), 0);
            const netProfit = totalRevenue - totalExpenses;
            const IVA_RATE = 0.16;
            const netProfitAfterIva = netProfit / (1 + IVA_RATE);
            const ivaAmount = netProfit - netProfitAfterIva;
            const pendingPayments = fTrips.reduce((s,t) => s + (t.clients||[]).reduce((cs,c) => {
                const paid = (c.payments||[]).reduce((ps,p) => ps+p.amount, 0);
                return cs + Math.max(0, (c.finalPrice||t.price||0) - paid);
            }, 0), 0);
            const profitMargin = totalRevenue > 0 ? ((netProfit/totalRevenue)*100).toFixed(1) : 0;
            const avgClientsPerTrip = totalTrips > 0 ? (totalClients/totalTrips).toFixed(1) : 0;
            const avgRevenuePerClient = totalClients > 0 ? totalRevenue/totalClients : 0;

            // --- Top clients (most trips) ---
            const clientTripCount = {};
            const clientDebt = {};
            fTrips.forEach(t => {
                (t.clients||[]).forEach(c => {
                    const key = c.globalClientId || c.name;
                    const name = c.name;
                    if (!clientTripCount[key]) clientTripCount[key] = { name, trips: 0, tripNames: [] };
                    clientTripCount[key].trips++;
                    clientTripCount[key].tripNames.push(t.name);
                    const paid = (c.payments||[]).reduce((s,p)=>s+p.amount,0);
                    const debt = Math.max(0, (c.finalPrice||t.price||0) - paid);
                    if (!clientDebt[key]) clientDebt[key] = { name, debt: 0, trips: [] };
                    clientDebt[key].debt += debt;
                    if (debt > 0) clientDebt[key].trips.push(t.name);
                });
            });
            const topClients = Object.values(clientTripCount).sort((a,b) => b.trips - a.trips).slice(0,10);
            const debtorClients = Object.values(clientDebt).filter(c => c.debt > 0).sort((a,b) => b.debt - a.debt).slice(0,10);

            // --- Most sold trips ---
            const tripSales = fTrips.map(t => ({
                name: t.name,
                destination: t.destination,
                clients: (t.clients||[]).length,
                revenue: (t.clients||[]).reduce((s,c) => s + (c.payments||[]).reduce((ps,p)=>ps+p.amount,0), 0)
            })).sort((a,b) => b.clients - a.clients).slice(0,8);

            // --- Transport usage (from catalogTrips) ---
            const transportMap = {};
            catalogTrips.forEach(ct => {
                if (ct.transport) {
                    const key = ct.transport.split(' ').slice(0,3).join(' ');
                    transportMap[key] = (transportMap[key]||0) + 1;
                }
            });
            const topTransport = Object.entries(transportMap).sort((a,b)=>b[1]-a[1]);

            // --- Payment methods ---
            const payMap = {};
            fTrips.forEach(t => (t.clients||[]).forEach(c => (c.payments||[]).forEach(p => {
                if (!payMap[p.method]) payMap[p.method] = {count:0, amount:0};
                payMap[p.method].count++; payMap[p.method].amount += p.amount;
            })));
            const topPayMethod = Object.entries(payMap).sort((a,b)=>b[1].count-a[1].count);

            // --- Trip categories (from catalogTrips matched by name) ---
            const catMap = {};
            fTrips.forEach(t => {
                const cat = (catalogTrips.find(c => c.name.toLowerCase() === t.name.toLowerCase())?.category) || 'Sin categoría';
                if (!catMap[cat]) catMap[cat] = {trips:0, clients:0, revenue:0};
                catMap[cat].trips++;
                catMap[cat].clients += (t.clients||[]).length;
                catMap[cat].revenue += (t.clients||[]).reduce((s,c)=>s+(c.payments||[]).reduce((ps,p)=>ps+p.amount,0),0);
            });

            // --- Expense categories ---
            const expMap = {};
            fTrips.forEach(t => (t.expenses||[]).forEach(e => {
                if (!expMap[e.category]) expMap[e.category] = {count:0, amount:0};
                expMap[e.category].count++; expMap[e.category].amount += e.amount;
            }));

            reportsContainer.innerHTML = `
                <!-- KPIs -->
                <div class="kpi-grid" style="margin-bottom:30px;">
                    <div class="kpi-card blue"><div class="kpi-value">${totalTrips}</div><div class="kpi-label"><i class="fas fa-suitcase-rolling"></i> Total Viajes</div></div>
                    <div class="kpi-card green"><div class="kpi-value">${completedTrips}</div><div class="kpi-label"><i class="fas fa-check-circle"></i> Realizados</div></div>
                    <div class="kpi-card blue"><div class="kpi-value">${totalClients}</div><div class="kpi-label"><i class="fas fa-users"></i> Total Clientes</div></div>
                    <div class="kpi-card green"><div class="kpi-value">${formatCurrency(totalRevenue)}</div><div class="kpi-label"><i class="fas fa-money-bill-wave"></i> Ingresos Totales</div></div>
                    <div class="kpi-card orange"><div class="kpi-value">${formatCurrency(totalExpenses)}</div><div class="kpi-label"><i class="fas fa-receipt"></i> Gastos Totales</div></div>
                    <div class="kpi-card ${netProfit>=0?'green':'red'}"><div class="kpi-value">${formatCurrency(netProfit)}</div><div class="kpi-label"><i class="fas fa-chart-line"></i> Ganancia Bruta</div></div>
                    <div class="kpi-card ${netProfitAfterIva>=0?'green':'red'}"><div class="kpi-value">${formatCurrency(netProfitAfterIva)}</div><div class="kpi-label"><i class="fas fa-file-invoice-dollar"></i> Ganancia después de IVA</div></div>
                    <div class="kpi-card orange"><div class="kpi-value">${formatCurrency(ivaAmount)}</div><div class="kpi-label"><i class="fas fa-percentage"></i> IVA estimado (16%)</div></div>
                    <div class="kpi-card red"><div class="kpi-value">${formatCurrency(pendingPayments)}</div><div class="kpi-label"><i class="fas fa-hourglass-half"></i> Por Cobrar</div></div>
                    <div class="kpi-card blue"><div class="kpi-value">${profitMargin}%</div><div class="kpi-label"><i class="fas fa-percentage"></i> Margen de Ganancia</div></div>
                    <div class="kpi-card"><div class="kpi-value">${avgClientsPerTrip}</div><div class="kpi-label"><i class="fas fa-user-friends"></i> Prom. Pasajeros/Viaje</div></div>
                    <div class="kpi-card green"><div class="kpi-value">${formatCurrency(avgRevenuePerClient)}</div><div class="kpi-label"><i class="fas fa-dollar-sign"></i> Ingreso Prom./Cliente</div></div>
                </div>

                <!-- Charts row -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:30px;">
                    <div style="background:white;padding:20px;border-radius:12px;box-shadow:var(--shadow);">
                        <h4 style="margin-bottom:15px;"><i class="fas fa-chart-pie"></i> Ingresos por Categoría de Viaje</h4>
                        <div style="position:relative;height:240px;"><canvas id="categoryPieChart"></canvas></div>
                    </div>
                    <div style="background:white;padding:20px;border-radius:12px;box-shadow:var(--shadow);">
                        <h4 style="margin-bottom:15px;"><i class="fas fa-credit-card"></i> Método de Pago más usado</h4>
                        <div style="position:relative;height:240px;"><canvas id="payMethodChart"></canvas></div>
                    </div>
                </div>

                <!-- Tables row 1 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:30px;">
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-star" style="color:#ff9800;"></i> Clientes que más viajan</h4>
                        <table class="clients-table">
                            <thead><tr><th>#</th><th>Cliente</th><th>Viajes</th></tr></thead>
                            <tbody>
                            ${topClients.length > 0 ? topClients.map((c,i) => `
                                <tr>
                                    <td style="font-weight:700;color:#047698;">${i+1}</td>
                                    <td>
                                        <div style="font-weight:600;">${c.name}</div>
                                        <div style="font-size:0.75rem;color:var(--gray);">${c.tripNames.slice(0,2).join(', ')}${c.tripNames.length>2?'...':''}</div>
                                    </td>
                                    <td><span style="background:#e3f2fd;color:#1976d2;padding:3px 10px;border-radius:20px;font-weight:600;">${c.trips}</span></td>
                                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--gray);padding:20px;">Sin datos</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-exclamation-circle" style="color:#f44336;"></i> Clientes con deuda (por viaje)</h4>
                        <table class="clients-table">
                            <thead><tr><th>Cliente</th><th>Deuda Total</th><th>En viajes</th></tr></thead>
                            <tbody>
                            ${debtorClients.length > 0 ? debtorClients.map(c => `
                                <tr>
                                    <td style="font-weight:600;">${c.name}</td>
                                    <td style="color:#f44336;font-weight:700;">${formatCurrency(c.debt)}</td>
                                    <td style="font-size:0.8rem;color:var(--gray);">${c.trips.slice(0,2).join(', ')}${c.trips.length>2?'...':''}</td>
                                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:#4CAF50;padding:20px;"><i class="fas fa-check"></i> Sin deudas pendientes</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Tables row 2 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:30px;">
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-fire" style="color:#f44336;"></i> Viajes más vendidos</h4>
                        <table class="clients-table">
                            <thead><tr><th>Viaje</th><th>Pasajeros</th><th>Ingresos</th></tr></thead>
                            <tbody>
                            ${tripSales.length > 0 ? tripSales.map(t => `
                                <tr>
                                    <td>
                                        <div style="font-weight:600;">${t.name}</div>
                                        <div style="font-size:0.75rem;color:var(--gray);">${t.destination}</div>
                                    </td>
                                    <td><span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:20px;font-weight:600;">${t.clients}</span></td>
                                    <td style="color:#2e7d32;font-weight:600;">${formatCurrency(t.revenue)}</td>
                                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--gray);padding:20px;">Sin datos</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-bus"></i> Transporte más usado</h4>
                        <table class="clients-table">
                            <thead><tr><th>Transporte</th><th>Viajes</th></tr></thead>
                            <tbody>
                            ${topTransport.length > 0 ? topTransport.map(([t,c]) => `
                                <tr>
                                    <td style="font-weight:600;">${t}</td>
                                    <td><span style="background:#e3f2fd;color:#1976d2;padding:3px 10px;border-radius:20px;font-weight:600;">${c}</span></td>
                                </tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:var(--gray);padding:20px;">Agrega transporte en las fichas de viaje</td></tr>'}
                            </tbody>
                        </table>

                        <h4 style="margin-top:20px;margin-bottom:12px;"><i class="fas fa-credit-card"></i> Método de pago más usado</h4>
                        <table class="clients-table">
                            <thead><tr><th>Método</th><th>Usos</th><th>Monto</th></tr></thead>
                            <tbody>
                            ${topPayMethod.length > 0 ? topPayMethod.map(([m,d]) => `
                                <tr>
                                    <td style="font-weight:600;">${m.replace(/_/g,' ').toUpperCase()}</td>
                                    <td><span style="background:#fff8e1;color:#f57c00;padding:3px 10px;border-radius:20px;font-weight:600;">${d.count}</span></td>
                                    <td style="color:#2e7d32;">${formatCurrency(d.amount)}</td>
                                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--gray);padding:20px;">Sin datos de pagos</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Expense categories -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:30px;">
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-receipt"></i> Gastos por Categoría</h4>
                        <table class="clients-table">
                            <thead><tr><th>Categoría</th><th>Veces</th><th>Total</th><th>% del gasto</th></tr></thead>
                            <tbody>
                            ${Object.entries(expMap).length>0 ? Object.entries(expMap).sort((a,b)=>b[1].amount-a[1].amount).map(([cat,d]) => `
                                <tr>
                                    <td>${cat.replace(/_/g,' ').toUpperCase()}</td>
                                    <td>${d.count}</td>
                                    <td style="color:#f57c00;font-weight:600;">${formatCurrency(d.amount)}</td>
                                    <td>${totalExpenses>0?((d.amount/totalExpenses)*100).toFixed(1)+'%':'-'}</td>
                                </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--gray);padding:20px;">Sin gastos registrados</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 style="margin-bottom:12px;"><i class="fas fa-tags"></i> Ingresos por Categoría</h4>
                        <table class="clients-table">
                            <thead><tr><th>Categoría</th><th>Viajes</th><th>Pasajeros</th><th>Ingresos</th></tr></thead>
                            <tbody>
                            ${Object.entries(catMap).length>0 ? Object.entries(catMap).sort((a,b)=>b[1].revenue-a[1].revenue).map(([cat,d]) => `
                                <tr>
                                    <td style="font-weight:600;">${cat}</td>
                                    <td>${d.trips}</td>
                                    <td>${d.clients}</td>
                                    <td style="color:#2e7d32;font-weight:600;">${formatCurrency(d.revenue)}</td>
                                </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--gray);padding:20px;">Asigna categorías en las fichas de viaje</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="text-align:center;margin-top:30px;">
                    <button class="btn btn-secondary" onclick="exportReport()"><i class="fas fa-download"></i> Exportar Reporte</button>
                </div>
            `;

            updateMonthlyChart(fTrips);

            // Draw pie chart — category
            setTimeout(() => {
                const catCtx = document.getElementById('categoryPieChart');
                const payCtx = document.getElementById('payMethodChart');
                if (catCtx && Object.keys(catMap).length > 0) {
                    const catLabels = Object.keys(catMap);
                    const catData = catLabels.map(k => catMap[k].revenue);
                    const colors = ['#047698','#4cc9f0','#4CAF50','#ff9800','#f44336','#9c27b0','#00bcd4','#ff5722','#795548','#607d8b'];
                    new Chart(catCtx, {
                        type: 'doughnut',
                        data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: colors.slice(0,catLabels.length), borderWidth: 2 }] },
                        options: { responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'right', labels:{font:{size:11}} }, tooltip: { callbacks: { label: ctx => ctx.label + ': ' + formatCurrency(ctx.raw) } } } }
                    });
                }
                if (payCtx && Object.keys(payMap).length > 0) {
                    const payLabels = Object.keys(payMap).map(k=>k.replace(/_/g,' ').toUpperCase());
                    const payData = Object.values(payMap).map(d=>d.count);
                    const payColors = ['#047698','#4CAF50','#ff9800','#f44336','#9c27b0','#00bcd4','#ff5722'];
                    new Chart(payCtx, {
                        type: 'bar',
                        data: { labels: payLabels, datasets: [{ label:'Transacciones', data: payData, backgroundColor: payColors.slice(0,payLabels.length) }] },
                        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{beginAtZero:true, ticks:{stepSize:1}} } }
                    });
                }
            }, 100);
        }


        function updateMonthlyChart(filteredTrips) {
            const ctx = document.getElementById('monthlyChart').getContext('2d');
            
            if (monthlyChart) {
                monthlyChart.destroy();
            }
            
            const monthlyRevenue = {};
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            
            for (let i = 0; i < 12; i++) {
                const month = i + 1;
                monthlyRevenue[`${currentYear}-${month.toString().padStart(2, '0')}`] = 0;
            }
            
            filteredTrips.forEach(trip => {
                if (trip.clients) {
                    trip.clients.forEach(client => {
                        if (client.payments) {
                            client.payments.forEach(payment => {
                                const paymentDate = new Date(payment.date);
                                const paymentYear = paymentDate.getFullYear();
                                const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
                                const key = `${paymentYear}-${paymentMonth}`;
                                
                                if (monthlyRevenue[key] !== undefined) {
                                    monthlyRevenue[key] += payment.amount;
                                }
                            });
                        }
                    });
                }
            });
            
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const data = labels.map((label, index) => {
                const month = (index + 1).toString().padStart(2, '0');
                const key = `${currentYear}-${month}`;
                return monthlyRevenue[key] || 0;
            });
            
            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ingresos',
                        data: data,
                        backgroundColor: 'rgba(67, 97, 238, 0.6)',
                        borderColor: 'rgba(67, 97, 238, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Ingresos: ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            });
        }

        function resetDateFilter() {
            document.getElementById('reportStartDate').value = '';
            document.getElementById('reportEndDate').value = '';
            updateReport();
        }

        function exportReport() {
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            
            let filteredTrips = trips;
            if (startDate || endDate) {
                filteredTrips = trips.filter(trip => {
                    const tripStartDate = new Date(trip.startDate);
                    const tripEndDate = new Date(trip.endDate);
                    
                    if (startDate && endDate) {
                        return tripStartDate >= new Date(startDate) && tripEndDate <= new Date(endDate);
                    } else if (startDate) {
                        return tripStartDate >= new Date(startDate);
                    } else if (endDate) {
                        return tripEndDate <= new Date(endDate);
                    }
                    return true;
                });
            }
            
            let report = "REPORTE DE NÓMADAS TOURS\n";
            report += "=========================\n\n";
            
            if (startDate || endDate) {
                report += "FILTRO DE FECHAS\n";
                report += "----------------\n";
                if (startDate) report += `Fecha de inicio: ${formatDate(startDate)}\n`;
                if (endDate) report += `Fecha de fin: ${formatDate(endDate)}\n`;
                report += "\n";
            }
            
            const totalTrips = filteredTrips.length;
            const totalClients = filteredTrips.reduce((sum, trip) => sum + (trip.clients ? trip.clients.length : 0), 0);
            const totalRevenue = filteredTrips.reduce((sum, trip) => {
                const tripPayments = trip.clients ? trip.clients.reduce((clientSum, client) => {
                    return clientSum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
                }, 0) : 0;
                return sum + tripPayments;
            }, 0);
            const totalExpenses = filteredTrips.reduce((sum, trip) => {
                return sum + (trip.expenses ? trip.expenses.reduce((expenseSum, expense) => expenseSum + expense.amount, 0) : 0);
            }, 0);
            const netProfit = totalRevenue - totalExpenses;
            
            report += "RESUMEN GENERAL\n";
            report += "---------------\n";
            report += `Viajes Registrados: ${totalTrips}\n`;
            report += `Clientes Totales: ${totalClients}\n`;
            report += `Ingresos Recaudados: ${formatCurrency(totalRevenue)}\n`;
            report += `Gastos Registrados: ${formatCurrency(totalExpenses)}\n`;
            report += `Ganancia Neta: ${formatCurrency(netProfit)}\n\n`;
            
            const sortedTrips = [...filteredTrips].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            
            report += "ÚLTIMOS VIAJES\n";
            report += "--------------\n";
            
            if (sortedTrips.length > 0) {
                sortedTrips.slice(0, 10).forEach(trip => {
                    const clientsCount = trip.clients ? trip.clients.length : 0;
                    const totalPaid = trip.clients ? trip.clients.reduce((sum, client) => {
                        return sum + (client.payments ? client.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0);
                    }, 0) : 0;
                    const totalExpected = trip.clients ? trip.clients.reduce((sum, client) => sum + (client.finalPrice || trip.price), 0) : 0;
                    const totalPending = totalExpected - totalPaid;
                    const tripExpenses = trip.expenses ? trip.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
                    const tripNetProfit = totalPaid - tripExpenses;
                    
                    report += `\nViaje: ${trip.name}\n`;
                    report += `Destino: ${trip.destination}\n`;
                    report += `Fechas: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
                    report += `Precio por persona: ${formatCurrency(trip.price)}\n`;
                    report += `Número de clientes: ${clientsCount}\n`;
                    report += `Total recaudado: ${formatCurrency(totalPaid)}\n`;
                    report += `Total esperado: ${formatCurrency(totalExpected)}\n`;
                    report += `Total pendiente: ${formatCurrency(totalPending)}\n`;
                    report += `Gastos del viaje: ${formatCurrency(tripExpenses)}\n`;
                    report += `Ganancia neta: ${formatCurrency(tripNetProfit)}\n`;
                });
            } else {
                report += "No hay viajes registrados\n";
            }
            
            report += `\nGenerado el: ${new Date().toLocaleString('es-MX')}\n`;
            report += "Sistema de Gestión - Nómadas Tours\n";
            
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_nomadas_tours_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Reporte exportado exitosamente', 'success');
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.trips && Array.isArray(data.trips)) {
                        trips = data.trips;
                    } else {
                        showNotification('El archivo no contiene datos de viajes válidos', 'error');
                        return;
                    }
                    
                    if (data.globalClients && Array.isArray(data.globalClients)) {
                        globalClients = data.globalClients;
                    } else {
                        showNotification('El archivo no contiene datos de clientes válidos', 'error');
                        return;
                    }
                    
                    saveData();
                    renderDashboard();
                    renderGlobalClients();
                    populateFilterOptions();
                    showNotification('Datos importados exitosamente', 'success');
                } catch (error) {
                    showNotification('Error al procesar el archivo. Verifica que sea un JSON válido.', 'error');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
            
            event.target.value = '';
        }

        function exportData(format) {
            if (format === 'json') {
                const data = {
                    trips: trips,
                    globalClients: globalClients,
                    exportedAt: new Date().toISOString()
                };
                
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nomadas_tours_data_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showNotification('Datos exportados en formato JSON', 'success');
            } else if (format === 'csv') {
                let csv = 'Tipo,ID,Nombre,Detalles\n';
                
                trips.forEach(trip => {
                    csv += `Viaje,${trip.id},"${trip.name}","Destino: ${trip.destination}, Fechas: ${trip.startDate} a ${trip.endDate}, Precio: ${trip.price}"\n`;
                    
                    if (trip.clients) {
                        trip.clients.forEach(client => {
                            const clientPaid = client.payments ? client.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                            csv += `Cliente,${client.id},"${client.name}","Teléfono: ${client.phone || ''}, Email: ${client.email || ''}, Pagado: ${clientPaid}"\n`;
                        });
                    }
                    
                    if (trip.expenses) {
                        trip.expenses.forEach(expense => {
                            csv += `Gasto,${expense.id},"${expense.description}","Categoría: ${expense.category}, Monto: ${expense.amount}, Fecha: ${expense.date}"\n`;
                        });
                    }
                });
                
                globalClients.forEach(globalClient => {
                    let isInTrip = false;
                    
                    for (const trip of trips) {
                        if (trip.clients) {
                            for (const client of trip.clients) {
                                if (client.globalClientId === globalClient.id) {
                                    isInTrip = true;
                                    break;
                                }
                            }
                            if (isInTrip) break;
                        }
                    }
                    
                    if (!isInTrip) {
                        csv += `Cliente Global,${globalClient.id},"${globalClient.name}","Teléfono: ${globalClient.phone}, Email: ${globalClient.email || ''}"\n`;
                    }
                });
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nomadas_tours_data_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showNotification('Datos exportados en formato CSV', 'success');
            }
        }

        function clearData() {
            if (confirm('¿Estás seguro de que quieres eliminar todos los datos del sistema? Esta acción no se puede deshacer.')) {
                if (confirm('¡Esta es una acción irreversible! ¿Estás absolutamente seguro?')) {
                    trips = [];
                    globalClients = [];
                    saveData();
                    renderDashboard();
                    renderGlobalClients();
                    showNotification('Todos los datos han sido eliminados', 'success');
                }
            }
        }

        function exportProjectCode() {
            const html = document.documentElement.outerHTML;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nomadas_tours_sistema_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Código del sistema exportado exitosamente', 'success');
        }

        function createBackup() {
            const data = {
                trips: trips,
                globalClients: globalClients,
                backupDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nomadas_tours_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Respaldo creado exitosamente', 'success');
        }

        function restoreBackup(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.trips || !data.globalClients || !data.backupDate) {
                        showNotification('El archivo no es un respaldo válido', 'error');
                        return;
                    }
                    
                    if (confirm(`¿Estás seguro de que quieres restaurar el respaldo creado el ${new Date(data.backupDate).toLocaleString('es-MX')}? Esto reemplazará todos los datos actuales.`)) {
                        trips = data.trips;
                        globalClients = data.globalClients;
                        saveData();
                        renderDashboard();
                        renderGlobalClients();
                        populateFilterOptions();
                        showNotification('Respaldo restaurado exitosamente', 'success');
                    }
                } catch (error) {
                    showNotification('Error al procesar el archivo. Verifica que sea un respaldo válido.', 'error');
                    console.error('Restore error:', error);
                }
            };
            reader.readAsText(file);
            
            event.target.value = '';
        }

        function filterTrips() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            filteredTrips = [...trips];
            
            if (searchTerm) {
                filteredTrips = filteredTrips.filter(trip => {
                    const text = `${trip.name} ${trip.destination}`.toLowerCase();
                    return text.includes(searchTerm);
                });
            }
            
            applySorting();
        }



        function sortGlobalClients(field) {
            globalClients.sort((a, b) => {
                let valueA, valueB;
                
                switch(field) {
                    case 'name':
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                        break;
                    case 'phone':
                        valueA = a.phone || '';
                        valueB = b.phone || '';
                        break;
                    case 'email':
                        valueA = a.email || '';
                        valueB = b.email || '';
                        break;
                    case 'address':
                        valueA = a.address || '';
                        valueB = b.address || '';
                        break;
                    case 'food':
                        valueA = a.food ? 1 : 0;
                        valueB = b.food ? 1 : 0;
                        break;
                    default:
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                }
                
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
                return 0;
            });
            
            renderGlobalClients();
        }

        // Event listeners
        document.getElementById('whatsappMessage').addEventListener('input', function() {
            const count = this.value.length;
            document.getElementById('charCount').textContent = count;
            updateMessagePreview();
        });

        document.getElementById('clientDiscount').addEventListener('input', function() {
            const trip = trips.find(t => t.id === currentTripId);
            if (!trip) return;
            
            const discount = parseFloat(this.value) || 0;
            const originalPrice = trip.price;
            const finalPrice = originalPrice * (1 - discount / 100);
            
            document.getElementById('clientFinalPrice').value = finalPrice.toFixed(2);
        });

        // Add this function to fix the missing sortTrips function
        function sortTrips(field) {
            const currentOrder = sortConfig.field === field ? (sortConfig.order === 'asc' ? 'desc' : 'asc') : 'asc';
            sortConfig.field = field;
            sortConfig.order = currentOrder;
            
            document.getElementById('sortBy').value = field;
            document.getElementById('sortOrder').value = currentOrder;
            
            applySorting();
            
            const headers = document.querySelectorAll('#tripsTable th.sortable');
            headers.forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
                if (header.onclick && header.onclick.toString().includes(field)) {
                    header.classList.add(currentOrder === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            });
        }

        // =============================================
        // LOGO DESDE GOOGLE DRIVE
        // =============================================
        // ⬇⬇⬇ PON AQUÍ EL ID DE TU LOGO DE GOOGLE DRIVE ⬇⬇⬇
        const GOOGLE_DRIVE_LOGO_ID = 'TU_ID_DE_GOOGLE_DRIVE_AQUI';
        // ⬆⬆⬆ Ejemplo: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms' ⬆⬆⬆

        function updateLogoFromDrive() {
            // No se necesita acción manual — logo viene del código
        }

        function loadSavedLogo() {
            const driveId = GOOGLE_DRIVE_LOGO_ID;
            if (driveId && driveId !== 'TU_ID_DE_GOOGLE_DRIVE_AQUI') {
                document.getElementById('gdriveLogo').value = driveId;
                const logoUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
                const logoEl = document.getElementById('companyLogo');
                if (logoEl) {
                    logoEl.src = logoUrl;
                    logoEl.style.display = 'block';
                    logoEl.onerror = function() { logoEl.style.display = 'none'; };
                }
            }
            // Load saved company info
            const savedCompany = JSON.parse(localStorage.getItem('nomadasCompanyInfo') || '{}');
            if (savedCompany.name) document.getElementById('companyName').value = savedCompany.name;
            if (savedCompany.phone) document.getElementById('companyPhone').value = savedCompany.phone;
            if (savedCompany.email) document.getElementById('companyEmail').value = savedCompany.email;
            if (savedCompany.website) document.getElementById('companyWebsite').value = savedCompany.website;
        }

        function saveCompanyInfo() {
            const info = {
                name: document.getElementById('companyName').value,
                phone: document.getElementById('companyPhone').value,
                email: document.getElementById('companyEmail').value,
                website: document.getElementById('companyWebsite').value
            };
            localStorage.setItem('nomadasCompanyInfo', JSON.stringify(info));
        }

        // =============================================
        // TRIP REGISTRY
        // =============================================
        // catalogTrips = fichas logísticas únicas (independiente de trips)
        let catalogTrips = JSON.parse(localStorage.getItem('nomadasCatalogTrips') || '[]');

        function saveCatalogTrips() {
            localStorage.setItem('nomadasCatalogTrips', JSON.stringify(catalogTrips));
        }

        function renderTripRegistry() {
            filterTripRegistry();
        }

        function filterTripRegistry() {
            const container = document.getElementById('tripRegistryContent');
            if (!container) return;
            const search = (document.getElementById('regSearch')?.value || '').toLowerCase();
            const status = document.getElementById('regStatusFilter')?.value || '';

            let filtered = [...catalogTrips];
            if (search) filtered = filtered.filter(t => (t.name+t.destination+t.description).toLowerCase().includes(search));
            if (status) filtered = filtered.filter(t => (t.status||'activo') === status);
            filtered.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

            const countEl = document.getElementById('regCount');
            if (countEl) countEl.textContent = filtered.length + ' ficha' + (filtered.length !== 1 ? 's' : '');
            if (filtered.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-book-open"></i><h3>No hay fichas registradas</h3><p>Crea la primera ficha logística haciendo clic en "Nueva Ficha"</p></div>`;
                return;
            }
            container.innerHTML = filtered.map(t => renderCatalogCard(t)).join('');
        }

        function renderCatalogCard(t) {
            const isActive = (t.status||'activo') === 'activo';
            const statusColor = isActive ? '#047698' : '#9e9e9e';
            const providers = (t.providers||[]);
            const includes = (t.includes||[]);
            const excludes = (t.excludes||[]);
            const catColors = {Playa:'#0288d1',Ciudad:'#455a64',Aventura:'#e64a19',Cultural:'#7b1fa2',Naturaleza:'#2e7d32',Internacional:'#1565c0',Nacional:'#00838f',Económico:'#f57f17',Premium:'#ad1457'};
            const catColor = catColors[t.category] || '#047698';

            return `
                <div style="background:white;border-radius:14px;box-shadow:0 2px 16px rgba(0,0,0,.08);margin-bottom:18px;overflow:hidden;border:1px solid #f0f0f0;transition:box-shadow .2s;" onmouseenter="this.style.boxShadow='0 6px 28px rgba(0,0,0,.14)'" onmouseleave="this.style.boxShadow='0 2px 16px rgba(0,0,0,.08)'">
                    <!-- Card header stripe -->
                    <div style="background:linear-gradient(135deg,${statusColor},${statusColor}dd);padding:16px 20px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
                                <span style="font-size:1.15rem;font-weight:700;color:white;">${t.name}</span>
                                ${t.category ? `<span style="background:${catColor};color:white;padding:2px 10px;border-radius:20px;font-size:0.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">${t.category}</span>` : ''}
                                <span style="background:${isActive?'rgba(255,255,255,.25)':'rgba(0,0,0,.2)'};color:white;padding:2px 9px;border-radius:20px;font-size:0.73rem;">${isActive?'● Activo':'○ Inactivo'}</span>
                            </div>
                            <div style="color:rgba(255,255,255,.85);font-size:0.88rem;display:flex;gap:16px;flex-wrap:wrap;">
                                <span><i class="fas fa-map-marker-alt"></i> ${t.destination}</span>
                                ${t.duration ? `<span><i class="fas fa-clock"></i> ${t.duration}</span>` : ''}
                                ${t.capacity ? `<span><i class="fas fa-users"></i> Hasta ${t.capacity} pax</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;">
                            ${t.price ? `<div style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 14px;text-align:center;"><div style="font-size:1rem;font-weight:700;color:white;">${formatCurrency(t.price)}</div><div style="font-size:0.68rem;color:rgba(255,255,255,.75);text-transform:uppercase;">por persona</div></div>` : ''}
                            <button class="btn btn-small" style="background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.35);" onclick="editCatalogTrip('${t.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-small btn-danger" style="opacity:.85;" onclick="deleteCatalogTrip('${t.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>

                    <!-- Card body -->
                    <div style="padding:18px 20px;">
                        ${t.description ? `<p style="color:#555;font-size:0.9rem;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f5f5f5;">${t.description}</p>` : ''}

                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:${(t.logistics||providers.length>0||includes.length>0)?'16px':'0'};">
                            ${t.transport ? `<div style="background:#f8f9fa;border-radius:8px;padding:10px 12px;"><div style="font-size:0.72rem;color:var(--gray);font-weight:700;text-transform:uppercase;margin-bottom:3px;"><i class="fas fa-bus"></i> Transporte</div><div style="font-size:0.88rem;font-weight:500;">${t.transport}</div></div>` : ''}
                            ${t.accommodation ? `<div style="background:#f8f9fa;border-radius:8px;padding:10px 12px;"><div style="font-size:0.72rem;color:var(--gray);font-weight:700;text-transform:uppercase;margin-bottom:3px;"><i class="fas fa-hotel"></i> Hospedaje</div><div style="font-size:0.88rem;font-weight:500;">${t.accommodation}</div></div>` : ''}
                            ${t.meals ? `<div style="background:#f8f9fa;border-radius:8px;padding:10px 12px;"><div style="font-size:0.72rem;color:var(--gray);font-weight:700;text-transform:uppercase;margin-bottom:3px;"><i class="fas fa-utensils"></i> Alimentación</div><div style="font-size:0.88rem;font-weight:500;">${t.meals}</div></div>` : ''}
                        </div>

                        ${t.logistics ? `<div style="background:#eef6fa;border-radius:8px;padding:12px 14px;margin-bottom:14px;border-left:3px solid #047698;"><div style="font-size:0.72rem;color:#047698;font-weight:700;text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-route"></i> Itinerario / Logística</div><pre style="margin:0;white-space:pre-wrap;font-family:'Poppins',sans-serif;font-size:0.85rem;color:#444;line-height:1.6;">${t.logistics}</pre></div>` : ''}

                        ${providers.length > 0 ? `<div style="margin-bottom:12px;"><span style="font-size:0.75rem;font-weight:700;color:var(--gray);text-transform:uppercase;display:block;margin-bottom:6px;"><i class="fas fa-handshake"></i> Proveedores</span>${providers.map(p=>`<span style="display:inline-block;background:#e3f2fd;color:#1565c0;padding:3px 10px;border-radius:14px;font-size:0.8rem;margin:2px;font-weight:500;">${p}</span>`).join('')}</div>` : ''}

                        ${includes.length > 0 || excludes.length > 0 ? `
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            ${includes.length > 0 ? `<div><span style="font-size:0.75rem;font-weight:700;color:#2e7d32;text-transform:uppercase;display:block;margin-bottom:6px;"><i class="fas fa-check-circle"></i> Incluye</span>${includes.map(i=>`<div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;padding:2px 0;"><i class="fas fa-check" style="color:#4CAF50;font-size:0.7rem;flex-shrink:0;"></i>${i}</div>`).join('')}</div>` : '<div></div>'}
                            ${excludes.length > 0 ? `<div><span style="font-size:0.75rem;font-weight:700;color:#c62828;text-transform:uppercase;display:block;margin-bottom:6px;"><i class="fas fa-times-circle"></i> No Incluye</span>${excludes.map(i=>`<div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;padding:2px 0;color:#666;"><i class="fas fa-times" style="color:#f44336;font-size:0.7rem;flex-shrink:0;"></i>${i}</div>`).join('')}</div>` : ''}
                        </div>` : ''}

                        ${t.promoText ? `<div style="background:linear-gradient(135deg,#fff8e1,#fff3cd);border-radius:8px;padding:12px 14px;margin-bottom:12px;border-left:3px solid #f9a825;font-size:0.87rem;font-style:italic;color:#5d4037;">"${t.promoText}"</div>` : ''}

                        ${t.notes ? `<div style="background:#f9f9f9;border-radius:8px;padding:10px 12px;font-size:0.82rem;color:#666;border-left:3px solid #ccc;margin-bottom:12px;"><i class="fas fa-sticky-note" style="margin-right:6px;"></i>${t.notes}</div>` : ''}

                        <!-- Action buttons -->
                        <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:14px;border-top:1px solid #f5f5f5;">
                            <button class="btn btn-primary" style="flex:1;" onclick="createQuoteFromCatalog('${t.id}')"><i class="fas fa-file-invoice"></i> Cotizar</button>
                            <button class="btn btn-whatsapp" style="flex:1;" onclick="openShareTripModal('${t.id}')"><i class="fas fa-share-alt"></i> Compartir</button>
                            <button class="btn btn-secondary" onclick="editCatalogTrip('${t.id}')"><i class="fas fa-edit"></i> Editar</button>
                        </div>

                        <div style="font-size:0.72rem;color:#ccc;margin-top:10px;text-align:right;">
                            Registrado: ${t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-MX') : '—'}
                        </div>
                    </div>
                </div>
            `;
        }


        function showNewCatalogTripModal() {
            document.getElementById('catalogTripModalTitle').textContent = 'Nueva Ficha de Viaje';
            document.getElementById('catalogTripForm').reset();
            document.getElementById('catalogIncludesContainer').innerHTML = '';
            document.getElementById('catalogExcludesContainer').innerHTML = '';
            document.getElementById('catalogProvidersContainer').innerHTML = '';
            document.getElementById('catCostsContainer').innerHTML = '';
            document.getElementById('catPriceSummary').style.display = 'none';
            // Reset taxes to just the default IVA row
            document.getElementById('catTaxesContainer').innerHTML = `
                <div class="tax-row" style="display:grid;grid-template-columns:auto 2fr 1fr auto;gap:8px;align-items:center;margin-bottom:6px;">
                    <input type="checkbox" id="taxIva" checked onchange="calcSuggestedPrice()" style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer;">
                    <input type="text" value="IVA" readonly style="padding:8px;border:2px solid #e9ecef;border-radius:8px;background:#f8f9fa;font-family:'Poppins',sans-serif;font-size:0.85rem;color:#555;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <input type="number" value="16" min="0" max="100" step="0.1" onchange="calcSuggestedPrice()" style="padding:8px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.85rem;width:70px;">
                        <span style="font-size:0.85rem;color:#666;">%</span>
                    </div>
                    <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.tax-row').remove();calcSuggestedPrice()"><i class="fas fa-times"></i></button>
                </div>`;
            populateCategorySelect('');
            currentCatalogTripId = null;
            document.getElementById('catalogTripModal').style.display = 'block';
        }

        let currentCatalogTripId = null;

        function editCatalogTrip(id) {
            const t = catalogTrips.find(c => c.id === id);
            if (!t) return;
            currentCatalogTripId = id;
            document.getElementById('catalogTripModalTitle').textContent = 'Editar Ficha de Viaje';
            document.getElementById('catName').value = t.name || '';
            document.getElementById('catDestination').value = t.destination || '';
            document.getElementById('catCategory').value = t.category || '';
            document.getElementById('catDuration').value = t.duration || '';
            document.getElementById('catCapacity').value = t.capacity || '';
            document.getElementById('catPrice').value = t.price || '';
            if (t.personsEstimate) document.getElementById('catPersonsEstimate').value = t.personsEstimate;
            if (t.margin !== undefined) document.getElementById('catMargin').value = t.margin;
            document.getElementById('catStatus').value = t.status || 'activo';
            populateCategorySelect(t.category || '');
            document.getElementById('catDescription').value = t.description || '';
            document.getElementById('catLogistics').value = t.logistics || '';
            document.getElementById('catTransport').value = t.transport || '';
            document.getElementById('catAccommodation').value = t.accommodation || '';
            document.getElementById('catMeals').value = t.meals || '';
            document.getElementById('catPromoText').value = t.promoText || '';
            document.getElementById('catNotes').value = t.notes || '';
            
            // Providers
            // Re-populate costs with tipo
            const costsCont = document.getElementById('catCostsContainer');
            costsCont.innerHTML = '';
            (t.costs||[]).forEach(c => addCatCostRow(c.desc||'', c.amt||0, c.tipo||'total'));

            const provCont = document.getElementById('catalogProvidersContainer');
            provCont.innerHTML = '';
            (t.providers||[]).forEach(p => addCatalogTagItem('catalogProvidersContainer', p));
            
            // Includes
            const incCont = document.getElementById('catalogIncludesContainer');
            incCont.innerHTML = '';
            (t.includes||[]).forEach(i => addCatalogTagItem('catalogIncludesContainer', i, 'Incluye'));
            
            // Excludes
            const excCont = document.getElementById('catalogExcludesContainer');
            excCont.innerHTML = '';
            (t.excludes||[]).forEach(e => addCatalogTagItem('catalogExcludesContainer', e, 'No incluye'));
            
            document.getElementById('catalogTripModal').style.display = 'block';
        }

        function addCatalogTagItem(containerId, value='', placeholder='') {
            const container = document.getElementById(containerId);
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
            div.innerHTML = `<input type="text" value="${value}" placeholder="${placeholder || 'Ej: Hotel'}" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;"><button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
            container.appendChild(div);
        }

        function deleteCatalogTrip(id) {
            const t = catalogTrips.find(c => c.id === id);
            if (!t) return;
            if (confirm(`¿Eliminar la ficha "${t.name}"? Esta acción no se puede deshacer.`)) {
                catalogTrips = catalogTrips.filter(c => c.id !== id);
                saveCatalogTrips();
                renderTripRegistry();
                showNotification('Ficha eliminada', 'success');
            }
        }

        function closeCatalogTripModal() {
            document.getElementById('catalogTripModal').style.display = 'none';
            currentCatalogTripId = null;
        }

        // ============ CATEGORÍAS PERSONALIZABLES ============
        const DEFAULT_CATEGORIES = ['Playa','Ciudad','Aventura','Cultural','Naturaleza','Internacional','Nacional','Económico','Premium'];

        function getCategories() {
            const saved = localStorage.getItem('nomadasCategories');
            return saved ? JSON.parse(saved) : [...DEFAULT_CATEGORIES];
        }

        function saveCategories(cats) {
            localStorage.setItem('nomadasCategories', JSON.stringify(cats));
        }

        function populateCategorySelect(selectedValue) {
            const sel = document.getElementById('catCategory');
            if (!sel) return;
            const cats = getCategories();
            sel.innerHTML = '<option value="">Sin categoría</option>';
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                if (c === selectedValue) opt.selected = true;
                sel.appendChild(opt);
            });
        }

        function openManageCategoriesModal() {
            renderCategoriesList();
            document.getElementById('manageCategoriesModal').style.display = 'block';
        }

        function renderCategoriesList() {
            const container = document.getElementById('categoriesListContainer');
            if (!container) return;
            const cats = getCategories();
            if (cats.length === 0) {
                container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px;">No hay categorías. Agrega una arriba.</p>';
                return;
            }
            container.innerHTML = cats.map((c,i) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;margin-bottom:6px;background:#f8f9fa;border:1px solid #e9ecef;">
                    <span style="font-weight:500;"><i class="fas fa-tag" style="color:var(--primary);margin-right:8px;"></i>${c}</span>
                    <button type="button" class="btn btn-small btn-danger" onclick="deleteCategoryByIndex(${i})"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }

        function addNewCategory() {
            const input = document.getElementById('newCategoryInput');
            const val = input.value.trim();
            if (!val) return;
            const cats = getCategories();
            if (cats.includes(val)) { showNotification('Esa categoría ya existe', 'warning'); return; }
            cats.push(val);
            saveCategories(cats);
            input.value = '';
            renderCategoriesList();
            populateCategorySelect(document.getElementById('catCategory')?.value || '');
            showNotification('Categoría agregada', 'success');
        }

        function deleteCategoryByIndex(idx) {
            const cats = getCategories();
            const name = cats[idx];
            if (confirm('¿Eliminar la categoría "' + name + '"?')) {
                cats.splice(idx, 1);
                saveCategories(cats);
                renderCategoriesList();
                populateCategorySelect(document.getElementById('catCategory')?.value || '');
                showNotification('Categoría eliminada', 'success');
            }
        }

        // =============================================
        // CALCULADORA PRECIO SUGERIDO (en catálogo)
        // =============================================
        function addCatCostRow(desc='', amt=0, tipo='total') {
            const container = document.getElementById('catCostsContainer');
            const div = document.createElement('div');
            div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1.2fr auto;gap:8px;margin-bottom:8px;align-items:center;';
            div.innerHTML = `
                <input type="text" placeholder="Ej: Autobús rentado, Hotel, Seguro..." value="${desc}"
                    style="padding:9px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.9rem;"
                    oninput="calcSuggestedPrice()">
                <input type="number" placeholder="Monto $" value="${amt||''}" min="0" step="0.01"
                    style="padding:9px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.9rem;"
                    oninput="calcSuggestedPrice()">
                <select onchange="calcSuggestedPrice()"
                    style="padding:9px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.85rem;">
                    <option value="total" ${tipo==='total'?'selected':''}>💼 Costo total del grupo</option>
                    <option value="persona" ${tipo==='persona'?'selected':''}>👤 Ya es por persona</option>
                    <option value="servicio" ${tipo==='servicio'?'selected':''}>🔧 Por servicio/unidad</option>
                </select>
                <button type="button" class="btn btn-small btn-danger"
                    onclick="this.parentElement.remove();calcSuggestedPrice()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        }

        function addTaxRow(name='', pct=0) {
            const container = document.getElementById('catTaxesContainer');
            const div = document.createElement('div');
            div.className = 'tax-row';
            div.style.cssText = 'display:grid;grid-template-columns:auto 2fr 1fr auto;gap:8px;align-items:center;margin-bottom:6px;';
            div.innerHTML = `
                <input type="checkbox" checked onchange="calcSuggestedPrice()" style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer;">
                <input type="text" value="${name}" placeholder="Nombre del impuesto" style="padding:8px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.85rem;" oninput="calcSuggestedPrice()">
                <div style="display:flex;align-items:center;gap:4px;">
                    <input type="number" value="${pct||''}" placeholder="%" min="0" max="100" step="0.1" onchange="calcSuggestedPrice()" style="padding:8px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;font-size:0.85rem;width:70px;">
                    <span style="font-size:0.85rem;color:#666;">%</span>
                </div>
                <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.tax-row').remove();calcSuggestedPrice()"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(div);
        }

        function calcSuggestedPrice() {
            const container = document.getElementById('catCostsContainer');
            const rows = container.querySelectorAll('div');
            const persons = parseInt(document.getElementById('catPersonsEstimate').value) || 1;
            let totalCostPerPerson = 0;
            let breakdown = [];

            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const select = row.querySelector('select');
                if (inputs.length < 2 || !select) return;
                const desc = inputs[0].value || 'Costo';
                const amt = parseFloat(inputs[1].value) || 0;
                const tipo = select.value;
                if (amt <= 0) return;

                let cpp = 0, label = '';
                if (tipo === 'total') {
                    cpp = amt / persons;
                    label = formatCurrency(amt) + ' ÷ ' + persons + ' pax = ' + formatCurrency(cpp) + '/persona';
                } else if (tipo === 'persona') {
                    cpp = amt;
                    label = formatCurrency(amt) + '/persona';
                } else if (tipo === 'servicio') {
                    cpp = amt / persons;
                    label = formatCurrency(amt) + '/servicio ÷ ' + persons + ' pax = ' + formatCurrency(cpp) + '/persona';
                }
                totalCostPerPerson += cpp;
                breakdown.push({ desc, cpp, label });
            });

            const margin = parseFloat(document.getElementById('catMargin').value) || 0;
            const withMargin = margin < 100 ? totalCostPerPerson / (1 - margin / 100) : totalCostPerPerson;
            const totalGroupCost = totalCostPerPerson * persons;

            // Collect active taxes
            const taxRows = document.querySelectorAll('#catTaxesContainer .tax-row');
            let totalTaxAmount = 0;
            let taxBreakdownParts = [];
            taxRows.forEach(row => {
                const cb = row.querySelector('input[type="checkbox"]');
                const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
                if (!cb || !cb.checked) return;
                const taxName = (inputs[0] && inputs[0].type === 'text') ? inputs[0].value || 'Impuesto' : 'IVA';
                // For the IVA default row, read value from number input after label
                const numInputs = row.querySelectorAll('input[type="number"]');
                const pct = parseFloat(numInputs[numInputs.length-1]?.value) || 0;
                if (pct <= 0) return;
                const taxAmt = withMargin * (pct / 100);
                totalTaxAmount += taxAmt;
                taxBreakdownParts.push(taxName + ' ' + pct + '%: ' + formatCurrency(taxAmt));
            });

            const suggested = withMargin + totalTaxAmount;

            if (totalCostPerPerson <= 0) {
                document.getElementById('catPriceSummary').style.display = 'none';
                return;
            }

            let bkHTML = '';
            if (breakdown.length > 1) {
                bkHTML = breakdown.map(b =>
                    '<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px dashed #eee;font-size:0.8rem;">' +
                    '<span>' + b.desc + '</span><span style="color:#047698;">' + b.label + '</span></div>'
                ).join('');
            }

            document.getElementById('catPriceSummary').style.display = 'block';
            document.getElementById('catTotalCosts').textContent = formatCurrency(totalGroupCost) + ' (grupo)';
            document.getElementById('catCostPerPerson').innerHTML = (bkHTML ? '<div style="margin-bottom:4px;">' + bkHTML + '</div>' : '') + '<strong>' + formatCurrency(totalCostPerPerson) + '</strong>';
            document.getElementById('catMarginLabel').textContent = margin;
            document.getElementById('catWithMargin').textContent = formatCurrency(withMargin);

            const taxBreakRow = document.getElementById('catTaxBreakdownRow');
            const taxBreakEl = document.getElementById('catTaxBreakdown');
            if (taxBreakdownParts.length > 0) {
                taxBreakEl.innerHTML = taxBreakdownParts.map(p => '+ ' + p).join('<br>');
                taxBreakRow.style.display = '';
            } else {
                taxBreakRow.style.display = 'none';
            }
            document.getElementById('catIvaAmount').textContent = totalTaxAmount > 0 ? formatCurrency(totalTaxAmount) : '—';
            document.getElementById('catSuggestedPrice').textContent = formatCurrency(suggested);
        }

        function applySuggestedPrice() {
            const suggestedEl = document.getElementById('catSuggestedPrice');
            if (!suggestedEl || !suggestedEl.textContent) return;
            // Parse value from formatted currency
            const raw = suggestedEl.textContent.replace(/[^0-9.]/g, '');
            document.getElementById('catPrice').value = parseFloat(raw).toFixed(2);
            showNotification('Precio sugerido aplicado', 'success');
        }

        // =============================================
        // CARGAR CATÁLOGO EN FORMULARIO NUEVO VIAJE
        // =============================================
        function populateTripCatalogSelect() {
            const sel = document.getElementById('tripFromCatalog');
            if (!sel) return;
            sel.innerHTML = '<option value="">-- Viaje nuevo / manual --</option>';
            catalogTrips.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name + ' — ' + t.destination;
                sel.appendChild(opt);
            });
        }

        function loadCatalogIntoTripForm() {
            const id = document.getElementById('tripFromCatalog').value;
            const infoBox = document.getElementById('tripCatalogInfo');
            if (!id) {
                infoBox.style.display = 'none';
                return;
            }
            const t = catalogTrips.find(c => c.id === id);
            if (!t) return;

            document.getElementById('tripName').value = t.name;
            document.getElementById('tripDestination').value = t.destination;
            document.getElementById('tripDescription').value = t.promoText || t.description || '';

            if (t.price) {
                document.getElementById('tripBasePrice').value = t.price;
                document.getElementById('tripPrice').value = t.price;
            }

            // Show info box
            const includes = (t.includes||[]).map(i => `<span style="background:#e8f5e9;padding:2px 8px;border-radius:10px;margin:2px;display:inline-block;font-size:0.8rem;"><i class="fas fa-check" style="color:#4CAF50;"></i> ${i}</span>`).join('');
            const excludes = (t.excludes||[]).map(i => `<span style="background:#ffebee;padding:2px 8px;border-radius:10px;margin:2px;display:inline-block;font-size:0.8rem;"><i class="fas fa-times" style="color:#f44336;"></i> ${i}</span>`).join('');

            infoBox.style.display = 'block';
            infoBox.innerHTML = `
                <strong><i class="fas fa-book-open"></i> Cargado: ${t.name}</strong>
                ${t.price ? `<div style="margin-top:6px;"><strong style="color:#2e7d32;"><i class="fas fa-tag"></i> Precio sugerido: ${formatCurrency(t.price)} por persona</strong></div>` : ''}
                ${t.duration ? `<div style="margin-top:4px;font-size:0.85rem;"><i class="fas fa-clock"></i> Duración: ${t.duration}</div>` : ''}
                ${t.transport ? `<div style="font-size:0.85rem;"><i class="fas fa-bus"></i> Transporte: ${t.transport}</div>` : ''}
                ${t.accommodation ? `<div style="font-size:0.85rem;"><i class="fas fa-hotel"></i> Hospedaje: ${t.accommodation}</div>` : ''}
                ${includes ? `<div style="margin-top:8px;"><strong>Incluye:</strong> ${includes}</div>` : ''}
                ${excludes ? `<div style="margin-top:4px;"><strong>No incluye:</strong> ${excludes}</div>` : ''}
            `;
        }

        // =============================================
        // MODAL COMPARTIR VIAJE
        // =============================================
        let currentShareTripId = null;
        let currentShareTripData = null;
        let currentShareActiveTrip = null;

        function openShareTripModal(catalogId) {
            currentShareTripId = catalogId;
            currentShareTripData = catalogTrips.find(c => c.id === catalogId);
            if (!currentShareTripData) return;

            // Try to find an active trip with the same name
            currentShareActiveTrip = trips.find(t =>
                t.name.toLowerCase() === currentShareTripData.name.toLowerCase() ||
                (t.name.toLowerCase().includes(currentShareTripData.name.toLowerCase()))
            ) || null;

            // Reset checkboxes
            ['sh_name','sh_duration','sh_description','sh_promo','sh_price',
             'sh_logistics','sh_transport','sh_accommodation','sh_meals',
             'sh_includes','sh_excludes','sh_providers','sh_provider_contacts',
             'sh_clients','sh_payments','sh_food_needs','sh_team',
             'sh_expenses','sh_expenses_covered','sh_notes','sh_capacity']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.onchange = updateSharePreview;
            });

            document.getElementById('shareTeamList').value = '';
            document.getElementById('shareExpensesCovered').value = '';
            document.getElementById('shareProviderContacts').value = '';

            updateSharePreview();
            document.getElementById('shareTripModal').style.display = 'block';
        }

        function closeShareTripModal() {
            document.getElementById('shareTripModal').style.display = 'none';
            currentShareTripId = null;
        }

        function getChecked(id) {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        }

        function buildShareText(forWhatsApp = false) {
            const t = currentShareTripData;
            const at = currentShareActiveTrip;
            if (!t) return '';

            const nl = '\n';
            const sep = '─────────────────────';
            let txt = '';

            if (getChecked('sh_name')) {
                txt += (forWhatsApp ? '🌍 *' : '') + t.name + (forWhatsApp ? '*' : '') + nl;
                txt += (forWhatsApp ? '📍 ' : 'Destino: ') + t.destination + nl;
            }
            if (getChecked('sh_duration') && t.duration) txt += (forWhatsApp?'⏱ ':'Duración: ') + t.duration + nl;
            if (getChecked('sh_capacity') && t.capacity) txt += (forWhatsApp?'👥 ':'Capacidad: ') + t.capacity + ' personas' + nl;
            if (getChecked('sh_price') && t.price) txt += (forWhatsApp?'💵 *Precio: ':'Precio por persona: ') + formatCurrency(t.price) + (forWhatsApp?' pp*':'') + nl;

            if (getChecked('sh_description') && t.description) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'📄 *Descripción*':'DESCRIPCIÓN') + nl + t.description + nl;
            }
            if (getChecked('sh_promo') && t.promoText) {
                txt += nl + (forWhatsApp?'📣 ':'') + '"' + t.promoText + '"' + nl;
            }

            if (getChecked('sh_logistics') && t.logistics) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'🗺️ *ITINERARIO/LOGÍSTICA*':'ITINERARIO / LOGÍSTICA') + nl + t.logistics + nl;
            }
            if (getChecked('sh_transport') && t.transport) txt += nl + (forWhatsApp?'🚌 *Transporte:* ':'Transporte: ') + t.transport + nl;
            if (getChecked('sh_accommodation') && t.accommodation) txt += (forWhatsApp?'🏨 *Hospedaje:* ':'Hospedaje: ') + t.accommodation + nl;
            if (getChecked('sh_meals') && t.meals) txt += (forWhatsApp?'🍽️ *Alimentación:* ':'Alimentación: ') + t.meals + nl;

            if (getChecked('sh_includes') && (t.includes||[]).length > 0) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'✅ *INCLUYE*':'INCLUYE') + nl;
                t.includes.forEach(i => txt += (forWhatsApp?'• ':'• ') + i + nl);
            }
            if (getChecked('sh_excludes') && (t.excludes||[]).length > 0) {
                txt += nl + (forWhatsApp?'❌ *NO INCLUYE*':'NO INCLUYE') + nl;
                t.excludes.forEach(i => txt += '• ' + i + nl);
            }

            if (getChecked('sh_providers') && (t.providers||[]).length > 0) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'🤝 *PROVEEDORES*':'PROVEEDORES') + nl;
                t.providers.forEach(p => txt += '• ' + p + nl);
            }
            const provContacts = document.getElementById('shareProviderContacts').value.trim();
            if (getChecked('sh_provider_contacts') && provContacts) {
                txt += nl + (forWhatsApp?'📞 *CONTACTOS PROVEEDORES*':'CONTACTOS PROVEEDORES') + nl + provContacts + nl;
            }

            // Clients from active trip
            if (at && at.clients && at.clients.length > 0) {
                if (getChecked('sh_clients')) {
                    txt += nl + sep + nl;
                    txt += (forWhatsApp?'👥 *LISTA DE PASAJEROS*':'LISTA DE PASAJEROS') + ' (' + at.clients.length + ')' + nl;
                    at.clients.forEach((c, idx) => {
                        txt += (idx+1) + '. ' + c.name;
                        if (c.phone) txt += ' — ' + c.phone;
                        if (getChecked('sh_payments')) {
                            const paid = (c.payments||[]).reduce((s,p)=>s+p.amount,0);
                            const price = c.finalPrice || at.price;
                            const pending = price - paid;
                            txt += ' | Pagado: ' + formatCurrency(paid) + (pending > 0 ? ' | Pendiente: ' + formatCurrency(pending) : ' ✓');
                        }
                        txt += nl;
                    });
                }
                if (getChecked('sh_food_needs')) {
                    const foodClients = at.clients.filter(c => c.food);
                    if (foodClients.length > 0) {
                        txt += nl + (forWhatsApp?'🥗 *REQUERIMIENTOS ALIMENTARIOS*':'REQUERIMIENTOS ALIMENTARIOS') + nl;
                        foodClients.forEach(c => txt += '• ' + c.name + nl);
                    }
                }
            }

            const team = document.getElementById('shareTeamList').value.trim();
            if (getChecked('sh_team') && team) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'🧑‍💼 *EQUIPO / STAFF*':'EQUIPO / STAFF') + nl + team + nl;
            }

            if (at && at.expenses && at.expenses.length > 0 && getChecked('sh_expenses')) {
                const total = at.expenses.reduce((s,e)=>s+e.amount,0);
                txt += nl + sep + nl;
                txt += (forWhatsApp?'💰 *GASTOS DEL VIAJE*':'GASTOS DEL VIAJE') + nl;
                at.expenses.forEach(e => txt += '• ' + e.description + ': ' + formatCurrency(e.amount) + ' (' + e.category + ')' + nl);
                txt += 'Total: ' + formatCurrency(total) + nl;
            }

            const expCovered = document.getElementById('shareExpensesCovered').value.trim();
            if (getChecked('sh_expenses_covered') && expCovered) {
                txt += nl + (forWhatsApp?'✔️ *GASTOS CUBIERTOS POR EL VIAJE*':'GASTOS CUBIERTOS POR EL VIAJE') + nl + expCovered + nl;
            }

            if (getChecked('sh_notes') && t.notes) {
                txt += nl + sep + nl;
                txt += (forWhatsApp?'📝 *NOTAS*':'NOTAS') + nl + t.notes + nl;
            }

            const companyName = document.getElementById('companyName')?.value || 'Nómadas Tours';
            txt += nl + sep + nl;
            txt += (forWhatsApp?'— ':'') + companyName + (forWhatsApp?' 🌿':'') + nl;

            return txt;
        }

        function updateSharePreview() {
            const box = document.getElementById('shareTripPreviewBox');
            if (!box) return;
            const txt = buildShareText(false);
            box.innerHTML = '<pre style="white-space:pre-wrap;font-family:Poppins,sans-serif;font-size:0.85rem;color:#333;margin:0;">' + txt + '</pre>';
        }

        function shareViaWhatsApp() {
            const txt = buildShareText(true);
            if (!txt.trim()) { showNotification('Selecciona al menos una sección para compartir', 'warning'); return; }
            window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
        }

        function shareToPDF() {
            const t = currentShareTripData;
            if (!t) return;
            const txt = buildShareText(false);
            const safeName = t.name.replace(/[^a-zA-Z0-9]/g,'_');
            const w = window.open('', '_blank');
            const logoId = document.getElementById('gdriveLogo')?.value?.trim() || localStorage.getItem('nomadasLogoId') || '';
            const logoUrl = logoId ? 'https://drive.google.com/thumbnail?id=' + logoId + '&sz=w200' : '';
            const companyName = document.getElementById('companyName')?.value || 'Nómadas Tours';
            w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + t.name + '</title>' +
                '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
                '<style>body{font-family:Poppins,sans-serif;padding:30px;max-width:800px;margin:0 auto;}' +
                'h1{color:#047698;}pre{white-space:pre-wrap;line-height:1.7;font-family:inherit;font-size:0.95rem;}' +
                '.header{display:flex;align-items:center;gap:20px;background:linear-gradient(135deg,#047698,#03637d);color:white;padding:20px;border-radius:10px;margin-bottom:25px;}' +
                '.logo{height:55px;border-radius:8px;}' +
                '@media print{body{padding:15px;}}</style></head><body>' +
                '<div class="header">' + (logoUrl ? '<img src="'+logoUrl+'" class="logo" onerror="this.style.display=\'none\'">' : '') +
                '<div><div style="font-size:1.4rem;font-weight:700;">' + companyName + '</div><div style="opacity:0.85;">' + t.name + ' — ' + t.destination + '</div></div></div>' +
                '<pre>' + txt + '</pre>' +
                '<script>window.onload=function(){window.print();}<\/script></body></html>');
            w.document.close();
        }

        function copyShareText() {
            const txt = buildShareText(false);
            navigator.clipboard.writeText(txt).then(() => showNotification('Texto copiado al portapapeles', 'success'))
                .catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = txt;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    showNotification('Texto copiado', 'success');
                });
        }

        function createQuoteFromCatalog(id) {
            const t = catalogTrips.find(c => c.id === id);
            if (!t) return;
            showSection('quotations');
            setTimeout(() => {
                document.getElementById('quoteTripName').value = t.name + ' - ' + t.destination;
                document.getElementById('quotePricePerPerson').value = t.price || '';
                document.getElementById('quotePromoText').value = t.promoText || t.description || '';
                // Fill includes/excludes
                const incCont = document.getElementById('includesContainer');
                incCont.innerHTML = '';
                (t.includes||[]).forEach(i => {
                    const div = document.createElement('div');
                    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
                    div.innerHTML = `<input type="text" class="include-item" value="${i}" oninput="updateQuotePreview()" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;"><button type="button" class="btn btn-small btn-danger" onclick="removeIncludeItem(this)"><i class="fas fa-times"></i></button>`;
                    incCont.appendChild(div);
                });
                const excCont = document.getElementById('excludesContainer');
                excCont.innerHTML = '';
                (t.excludes||[]).forEach(e => {
                    const div = document.createElement('div');
                    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
                    div.innerHTML = `<input type="text" class="exclude-item" value="${e}" oninput="updateQuotePreview()" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;"><button type="button" class="btn btn-small btn-danger" onclick="removeExcludeItem(this)"><i class="fas fa-times"></i></button>`;
                    excCont.appendChild(div);
                });
                updateQuotePreview();
            }, 200);
        }

        // =============================================
        // QUOTATIONS
        // =============================================
        let quoteImages = [];

        function populateQuoteTripSelect() {
            const sel = document.getElementById('quoteSelectTrip');
            sel.innerHTML = '<option value="">-- Cotización manual --</option>';
            trips.forEach(trip => {
                const opt = document.createElement('option');
                opt.value = trip.id;
                opt.textContent = `${trip.name} - ${trip.destination}`;
                sel.appendChild(opt);
            });
        }

        function loadTripIntoQuote() {
            const tripId = document.getElementById('quoteSelectTrip').value;
            if (!tripId) { clearQuoteForm(); return; }
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;
            document.getElementById('quoteTripName').value = trip.name + ' - ' + trip.destination;
            document.getElementById('quoteDates').value = formatDate(trip.startDate) + ' - ' + formatDate(trip.endDate);
            document.getElementById('quotePricePerPerson').value = trip.price;
            document.getElementById('quotePromoText').value = trip.promoText || trip.description || '';
            updateQuotePreview();
        }

        function clearQuoteForm() {
            document.getElementById('quoteTripName').value = '';
            document.getElementById('quoteDates').value = '';
            document.getElementById('quotePricePerPerson').value = '';
            document.getElementById('quotePromoText').value = '';
            updateQuotePreview();
        }

        function addIncludeItem() {
            const container = document.getElementById('includesContainer');
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
            div.innerHTML = `<input type="text" class="include-item" placeholder="Ej: Alojamiento" oninput="updateQuotePreview()" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;"><button type="button" class="btn btn-small btn-danger" onclick="removeIncludeItem(this)"><i class="fas fa-times"></i></button>`;
            container.appendChild(div);
        }

        function removeIncludeItem(btn) {
            btn.parentElement.remove();
            updateQuotePreview();
        }

        function addExcludeItem() {
            const container = document.getElementById('excludesContainer');
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
            div.innerHTML = `<input type="text" class="exclude-item" placeholder="Ej: Gastos personales" oninput="updateQuotePreview()" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:8px;font-family:'Poppins',sans-serif;"><button type="button" class="btn btn-small btn-danger" onclick="removeExcludeItem(this)"><i class="fas fa-times"></i></button>`;
            container.appendChild(div);
        }

        function removeExcludeItem(btn) {
            btn.parentElement.remove();
            updateQuotePreview();
        }

        function handleQuoteImages(event) {
            quoteImages = [];
            const previews = document.getElementById('quoteImagePreviews');
            previews.innerHTML = '';
            const files = Array.from(event.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    quoteImages.push(e.target.result);
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.cssText = 'height:80px;border-radius:8px;border:2px solid #e9ecef;object-fit:cover;';
                    previews.appendChild(img);
                    updateQuotePreview();
                };
                reader.readAsDataURL(file);
            });
        }

        function getQuoteData() {
            const logoId = document.getElementById('gdriveLogo')?.value?.trim() || localStorage.getItem('nomadasLogoId') || '';
            const logoUrl = logoId ? `https://drive.google.com/thumbnail?id=${logoId}&sz=w200` : '';
            const companyName = document.getElementById('companyName').value || 'Nómadas Tours';
            const companyPhone = document.getElementById('companyPhone').value || '';
            const companyEmail = document.getElementById('companyEmail').value || '';
            const companyWebsite = document.getElementById('companyWebsite').value || '';
            const clientName = document.getElementById('quoteClientName').value || 'Cliente';
            const clientPhone = document.getElementById('quoteClientPhone').value || '';
            const quoteDate = document.getElementById('quoteDate').value;
            const tripName = document.getElementById('quoteTripName').value || 'Viaje sin nombre';
            const dates = document.getElementById('quoteDates').value || '';
            const persons = parseInt(document.getElementById('quotePersons').value) || 1;
            const pricePerPerson = parseFloat(document.getElementById('quotePricePerPerson').value) || 0;
            const discount = parseFloat(document.getElementById('quoteDiscount').value) || 0;
            const promoText = document.getElementById('quotePromoText').value || '';
            const notes = document.getElementById('quoteNotes').value || '';
            
            const includes = Array.from(document.querySelectorAll('.include-item')).map(i => i.value.trim()).filter(v=>v);
            const excludes = Array.from(document.querySelectorAll('.exclude-item')).map(i => i.value.trim()).filter(v=>v);
            
            const subtotal = pricePerPerson * persons;
            const discountAmount = subtotal * (discount/100);
            const total = subtotal - discountAmount;
            
            return { logoUrl, companyName, companyPhone, companyEmail, companyWebsite, clientName, clientPhone, quoteDate, tripName, dates, persons, pricePerPerson, discount, discountAmount, subtotal, total, promoText, notes, includes, excludes };
        }

        function updateQuotePreview() {
            saveCompanyInfo();
            const d = getQuoteData();
            const imagesHTML = quoteImages.map(src => `<img src="${src}" style="height:120px;object-fit:cover;border-radius:8px;flex:1;min-width:100px;">`).join('');
            
            const html = `
                <div class="quote-header-box">
                    <div style="display:flex;align-items:center;gap:15px;">
                        ${d.logoUrl ? `<img src="${d.logoUrl}" alt="Logo" style="height:60px;border-radius:8px;background:white;padding:3px;" onerror="this.style.display='none'">` : '<div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-plane-departure" style="font-size:2rem;"></i></div>'}
                        <div>
                            <div style="font-size:1.4rem;font-weight:700;">${d.companyName}</div>
                            ${d.companyPhone ? `<div style="opacity:0.85;font-size:0.9rem;"><i class="fas fa-phone"></i> ${d.companyPhone}</div>` : ''}
                            ${d.companyEmail ? `<div style="opacity:0.85;font-size:0.9rem;"><i class="fas fa-envelope"></i> ${d.companyEmail}</div>` : ''}
                            ${d.companyWebsite ? `<div style="opacity:0.85;font-size:0.9rem;"><i class="fas fa-globe"></i> ${d.companyWebsite}</div>` : ''}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.1rem;font-weight:700;background:rgba(255,255,255,0.2);padding:10px 15px;border-radius:8px;">COTIZACIÓN</div>
                        ${d.quoteDate ? `<div style="opacity:0.85;font-size:0.85rem;margin-top:5px;">${formatDate(d.quoteDate)}</div>` : ''}
                    </div>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:15px;">
                        <strong>Para:</strong> ${d.clientName}
                        ${d.clientPhone ? ` &nbsp;|&nbsp; <i class="fas fa-phone"></i> ${d.clientPhone}` : ''}
                    </div>
                    
                    ${d.promoText ? `<div style="background:#e3f2fd;border-radius:8px;padding:15px;margin-bottom:15px;border-left:4px solid #1976d2;font-style:italic;color:#333;">"${d.promoText}"</div>` : ''}
                    
                    <div class="quote-section-title"><i class="fas fa-suitcase-rolling"></i> DETALLE DEL VIAJE</div>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
                        <tr style="background:#f8f9fa;">
                            <td style="padding:10px;font-weight:600;border-bottom:1px solid #e9ecef;">Destino / Viaje</td>
                            <td style="padding:10px;border-bottom:1px solid #e9ecef;">${d.tripName}</td>
                        </tr>
                        ${d.dates ? `<tr><td style="padding:10px;font-weight:600;border-bottom:1px solid #e9ecef;background:#f8f9fa;">Fechas</td><td style="padding:10px;border-bottom:1px solid #e9ecef;">${d.dates}</td></tr>` : ''}
                        <tr style="background:#f8f9fa;">
                            <td style="padding:10px;font-weight:600;border-bottom:1px solid #e9ecef;">Personas</td>
                            <td style="padding:10px;border-bottom:1px solid #e9ecef;">${d.persons}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-weight:600;border-bottom:1px solid #e9ecef;background:#f8f9fa;">Precio por persona</td>
                            <td style="padding:10px;border-bottom:1px solid #e9ecef;">${formatCurrency(d.pricePerPerson)}</td>
                        </tr>
                        ${d.discount > 0 ? `<tr style="background:#f8f9fa;"><td style="padding:10px;font-weight:600;border-bottom:1px solid #e9ecef;">Descuento (${d.discount}%)</td><td style="padding:10px;border-bottom:1px solid #e9ecef;color:#f44336;">- ${formatCurrency(d.discountAmount)}</td></tr>` : ''}
                        <tr style="background:#e8f5e9;">
                            <td style="padding:12px;font-weight:700;font-size:1.05rem;"><i class="fas fa-money-bill-wave"></i> TOTAL</td>
                            <td style="padding:12px;font-weight:700;font-size:1.2rem;color:#2e7d32;">${formatCurrency(d.total)}</td>
                        </tr>
                    </table>
                    
                    ${d.includes.length > 0 ? `
                    <div class="quote-section-title"><i class="fas fa-check-circle"></i> INCLUYE</div>
                    <div style="margin-bottom:15px;">
                        ${d.includes.map(i => `<div class="quote-include-item"><i class="fas fa-check" style="color:#4CAF50;"></i> ${i}</div>`).join('')}
                    </div>` : ''}
                    
                    ${d.excludes.length > 0 ? `
                    <div class="quote-section-title" style="background:#f44336;"><i class="fas fa-times-circle"></i> NO INCLUYE</div>
                    <div style="margin-bottom:15px;">
                        ${d.excludes.map(e => `<div class="quote-include-item quote-exclude-item"><i class="fas fa-times" style="color:#f44336;"></i> ${e}</div>`).join('')}
                    </div>` : ''}
                    
                    ${quoteImages.length > 0 ? `
                    <div class="quote-section-title"><i class="fas fa-images"></i> FOTOS</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">${imagesHTML}</div>` : ''}
                    
                    ${d.notes ? `
                    <div class="quote-section-title"><i class="fas fa-info-circle"></i> NOTAS Y CONDICIONES</div>
                    <div style="font-size:0.85rem;color:#555;margin-bottom:15px;white-space:pre-line;">${d.notes}</div>` : ''}
                    
                    <div style="background:#f8f9fa;padding:12px;border-radius:8px;text-align:center;font-size:0.8rem;color:var(--gray);margin-top:20px;">
                        <i class="fas fa-heart" style="color:#e91e63;"></i> Gracias por confiar en ${d.companyName} &nbsp;|&nbsp; 
                        ${d.companyPhone} ${d.companyEmail ? '| '+d.companyEmail : ''}
                    </div>
                </div>
            `;
            const preview = document.getElementById('quotePrintArea');
            if (preview) preview.innerHTML = html;
        }

        function sendQuoteWhatsApp() {
            const d = getQuoteData();
            let phone = d.clientPhone.replace(/\D/g, '');
            if (!phone) { showNotification('Agrega el teléfono del cliente para enviar por WhatsApp', 'warning'); return; }
            if (phone.length === 10) phone = '52' + phone;
            const msg = `✈️ *COTIZACIÓN - ${d.companyName}*\n\n` +
                `Hola ${d.clientName}! 😊\n` +
                `Te comparto la cotización para:\n\n` +
                `🌍 *${d.tripName}*\n` +
                (d.dates ? `📅 ${d.dates}\n` : '') +
                `👥 ${d.persons} persona(s)\n` +
                `💵 Precio por persona: ${formatCurrency(d.pricePerPerson)}\n` +
                (d.discount > 0 ? `🎁 Descuento: ${d.discount}%\n` : '') +
                `\n💰 *TOTAL: ${formatCurrency(d.total)}*\n\n` +
                (d.includes.length > 0 ? '✅ *Incluye:*\n' + d.includes.map(i=>'• '+i).join('\n') + '\n\n' : '') +
                (d.promoText ? `📣 ${d.promoText}\n\n` : '') +
                `¡Contáctanos para reservar! 🙌`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function downloadQuotePDF() {
            const d = getQuoteData();
            const safeName = (d.clientName + '_' + d.tripName).replace(/[^a-zA-Z0-9_]/g,'_');
            
            const printContent = document.getElementById('quotePrintArea').innerHTML;
            const w = window.open('', '_blank');
            w.document.write(`<!DOCTYPE html><html><head>
                <meta charset="UTF-8">
                <title>Cotización ${d.clientName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    body { font-family:'Poppins',sans-serif; margin:0; padding:0; }
                    .quote-header-box { background:linear-gradient(135deg,#047698,#03637d); color:white; padding:25px 30px; display:flex; justify-content:space-between; align-items:center; gap:15px; }
                    .quote-section-title { background:#047698; color:white; padding:8px 15px; font-weight:600; font-size:0.95rem; margin:15px 0 10px; border-radius:5px; }
                    .quote-include-item { display:flex; align-items:center; gap:8px; padding:5px 0; }
                    table { width:100%; border-collapse:collapse; }
                    @media print { body { -webkit-print-color-adjust:exact; } }
                </style>
            </head><body>${printContent}<script>window.onload=function(){window.print();}<\/script></body></html>`);
            w.document.close();
        }

        function printQuote() {
            downloadQuotePDF();
        }

        function createQuoteFromTrip(tripId) {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;
            showSection('quotations');
            setTimeout(() => {
                document.getElementById('quoteSelectTrip').value = tripId;
                loadTripIntoQuote();
            }, 200);
        }

        // =============================================
        // ENHANCED REPORTS
        // =============================================


        // Catalog Trip Form submit
        document.getElementById('catalogTripForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const getTagValues = (containerId) => 
                Array.from(document.querySelectorAll(`#${containerId} input`))
                    .map(i => i.value.trim()).filter(v => v);
            
            const formData = {
                name: document.getElementById('catName').value.trim(),
                destination: document.getElementById('catDestination').value.trim(),
                category: document.getElementById('catCategory').value,
                status: document.getElementById('catStatus').value,
                duration: document.getElementById('catDuration').value.trim(),
                capacity: parseInt(document.getElementById('catCapacity').value) || null,
                price: parseFloat(document.getElementById('catPrice').value) || null,
                personsEstimate: parseInt(document.getElementById('catPersonsEstimate').value) || null,
                margin: parseFloat(document.getElementById('catMargin').value) || null,
                description: document.getElementById('catDescription').value.trim(),
                logistics: document.getElementById('catLogistics').value.trim(),
                transport: document.getElementById('catTransport').value.trim(),
                accommodation: document.getElementById('catAccommodation').value.trim(),
                meals: document.getElementById('catMeals').value.trim(),
                costs: (() => {
                    const rows = document.getElementById('catCostsContainer').querySelectorAll('div');
                    const result = [];
                    rows.forEach(row => {
                        const inputs = row.querySelectorAll('input');
                        const sel = row.querySelector('select');
                        if (inputs.length >= 2 && sel) {
                            const desc = inputs[0].value.trim();
                            const amt = parseFloat(inputs[1].value) || 0;
                            if (desc || amt > 0) result.push({ desc, amt, tipo: sel.value });
                        }
                    });
                    return result;
                })(),
                providers: getTagValues('catalogProvidersContainer'),
                includes: getTagValues('catalogIncludesContainer'),
                excludes: getTagValues('catalogExcludesContainer'),
                promoText: document.getElementById('catPromoText').value.trim(),
                notes: document.getElementById('catNotes').value.trim(),
            };
            
            if (!formData.name || !formData.destination) {
                showNotification('El nombre y destino son obligatorios', 'error');
                return;
            }
            
            if (currentCatalogTripId) {
                const idx = catalogTrips.findIndex(c => c.id === currentCatalogTripId);
                if (idx !== -1) {
                    catalogTrips[idx] = { ...catalogTrips[idx], ...formData };
                    showNotification('Ficha actualizada exitosamente', 'success');
                }
            } else {
                // Check for duplicate
                const dup = catalogTrips.find(c => c.name.toLowerCase() === formData.name.toLowerCase() && c.destination.toLowerCase() === formData.destination.toLowerCase());
                if (dup) {
                    showNotification('Ya existe una ficha con ese nombre y destino', 'warning');
                    return;
                }
                catalogTrips.push({ id: generateId(), ...formData, createdAt: new Date().toISOString() });
                showNotification('Ficha creada exitosamente', 'success');
            }
            
            saveCatalogTrips();
            closeCatalogTripModal();
            renderTripRegistry();
        });

        // Load logo on init
        document.addEventListener('DOMContentLoaded', function() {
            loadSavedLogo();
        });

// =================================================================================
// == CÓDIGO PARA GESTIÓN DE EQUIIPO DE EMPRESA ==
// =================================================================================

// --- VARIABLES GLOBALES PARA EQUIPO ---
let equipment = [];
let currentEditingEquipmentId = null;
let currentEditingTripId = null;

// --- CARGA INICIAL DE DATOS DE EQUIPO ---
// Esta función se llama cuando la página se carga por primera vez
function initializeEquipment() {
    loadEquipmentFromStorage();
    renderEquipmentTable();
}

// --- FUNCIONES DE GESTIÓN DE EQUIPO ---

function showSection(sectionId) {
    // Oculta todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    // Muestra la sección seleccionada
    document.getElementById(sectionId).classList.add('active');

    // Si la sección que se muestra es la de equipo, renderiza la tabla
    if (sectionId === 'equipment') {
        renderEquipmentTable();
    }
}

function showNewEquipmentModal() {
    console.log("Abriendo modal de nuevo equipo..."); // Mensaje para depuración
    document.getElementById('equipmentModalTitle').innerText = 'Nuevo Equipo';
    document.getElementById('equipmentForm').reset();
    document.getElementById('equipmentId').value = '';
    document.getElementById('equipmentModal').style.display = 'block';
}

function closeEquipmentModal() {
    document.getElementById('equipmentModal').style.display = 'none';
}

function saveEquipment(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional
    const id = document.getElementById('equipmentId').value;
    const equipmentData = {
        id: id || Date.now().toString(), // Usa timestamp como ID si es nuevo
        name: document.getElementById('equipmentName').value,
        quantity: parseInt(document.getElementById('equipmentQuantity').value),
        status: document.getElementById('equipmentStatus').value,
        brand: document.getElementById('equipmentBrand').value,
        capacity: document.getElementById('equipmentCapacity').value,
        location: document.getElementById('equipmentLocation').value,
        cost: parseFloat(document.getElementById('equipmentCost').value) || 0,
        observations: document.getElementById('equipmentObservations').value
    };

    if (id) {
        // Editar un equipo existente
        const index = equipment.findIndex(e => e.id === id);
        if (index > -1) {
            equipment[index] = equipmentData;
        }
    } else {
        // Agregar un nuevo equipo
        equipment.push(equipmentData);
    }

    saveEquipmentToStorage();
    renderEquipmentTable();
    closeEquipmentModal();
    showNotification('Equipo guardado correctamente', 'success');
}

function editEquipment(id) {
    const item = equipment.find(e => e.id === id);
    if (item) {
        document.getElementById('equipmentModalTitle').innerText = 'Editar Equipo';
        document.getElementById('equipmentId').value = item.id;
        document.getElementById('equipmentName').value = item.name;
        document.getElementById('equipmentQuantity').value = item.quantity;
        document.getElementById('equipmentStatus').value = item.status;
        document.getElementById('equipmentBrand').value = item.brand;
        document.getElementById('equipmentCapacity').value = item.capacity;
        document.getElementById('equipmentLocation').value = item.location;
        document.getElementById('equipmentCost').value = item.cost;
        document.getElementById('equipmentObservations').value = item.observations;
        document.getElementById('equipmentModal').style.display = 'block';
    }
}

function deleteEquipment(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer.')) {
        equipment = equipment.filter(e => e.id !== id);
        saveEquipmentToStorage();
        renderEquipmentTable();
        showNotification('Equipo eliminado', 'info');
    }
}

function renderEquipmentTable() {
    const tbody = document.getElementById('equipmentTableBody');
    tbody.innerHTML = ''; // Limpia la tabla antes de volver a renderizar

    if (equipment.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: #6c757d;">No hay equipo registrado. Haz clic en "Agregar Nuevo Equipo" para comenzar.</td></tr>';
        return;
    }

    equipment.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge status-${item.status.toLowerCase().replace(/\s+/g, '-')}">${item.status}</span></td>
            <td>${item.brand || '-'}</td>
            <td>${item.capacity || '-'}</td>
            <td>${item.location || '-'}</td>
            <td>$${item.cost.toFixed(2)}</td>
            <td>${item.observations || '-'}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="editEquipment('${item.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteEquipment('${item.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

function filterEquipment() {
    const search = document.getElementById('equipmentSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#equipmentTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}


// --- MANEJO DE EQUIPO DENTRO DEL MODAL DE VIAJES ---

function loadTripEquipment(tripId) {
    const container = document.getElementById('tripEquipmentContainer');
    container.innerHTML = ''; // Limpiar contenedor

    if (equipment.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; text-align: center;">No hay equipo registrado en el sistema. <a href="#" onclick="showSection(\'equipment\')">Regístralo aquí</a>.</p>';
        return;
    }

    // Obtener el viaje actual para cargar las cantidades asignadas
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const currentTrip = trips.find(t => t.id === tripId);
    const assignedEquipment = currentTrip ? currentTrip.assignedEquipment || {} : {};

    equipment.forEach(item => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '8px';
        div.style.borderBottom = '1px solid #eee';

        const label = document.createElement('label');
        label.style.margin = '0';
        label.style.flexGrow = '1';
        label.innerHTML = `${item.name} <small>(Disponible: ${item.quantity})</small>`;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = item.quantity;
        input.value = assignedEquipment[item.id] || 0;
        input.className = 'form-control'; // Usa clase existente para estilo
        input.style.width = '80px';
        input.style.marginLeft = '10px';
        input.dataset.equipmentId = item.id;

        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
}

// --- ALMACENAMIENTO LOCAL (LOCAL STORAGE) ---

function saveEquipmentToStorage() {
    localStorage.setItem('equipment', JSON.stringify(equipment));
}

function loadEquipmentFromStorage() {
    const stored = localStorage.getItem('equipment');
    if (stored) {
        equipment = JSON.parse(stored);
    }
}


// --- EVENT LISTENERS PARA EQUIPO ---

// Asegurarse de que el DOM esté listo antes de asignar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el equipo al cargar la página
    initializeEquipment();

    // Asignar el evento submit al formulario de equipo
    const equipmentForm = document.getElementById('equipmentForm');
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', saveEquipment);
    }

    // Cerrar modales al hacer clic fuera de la ventana
    window.onclick = function(event) {
        const equipmentModal = document.getElementById('equipmentModal');
        if (event.target === equipmentModal) {
            closeEquipmentModal();
        }
        // ... otros modales si los tienes
    }
});

// Sobrescribimos la función de mostrar/editar viajes para que también cargue el equipo
const originalShowNewTripModal = window.showNewTripModal;
window.showNewTripModal = function(tripId) {
    currentEditingTripId = tripId;
    loadTripEquipment(tripId); // Carga el equipment al abrir el modal de viaje
    if (originalShowNewTripModal) {
        originalShowNewTripModal(tripId);
    }
};

const originalEditTrip = window.editTrip;
window.editTrip = function(tripId) {
    currentEditingTripId = tripId;
    loadTripEquipment(tripId); // Carga el equipment al editar un viaje
    if (originalEditTrip) {
        originalEditTrip(tripId);
    }
};

// Sobrescribimos la función de guardar viajes para que también guarde el equipo asignado
const originalSaveTrip = window.saveTrip; // Asumimos que tienes una función saveTrip
window.saveTrip = function(tripId) {
    // Recopilar datos del equipo del modal de viaje
    const assignedEquipment = {};
    const equipmentInputs = document.querySelectorAll('#tripEquipmentContainer input[data-equipment-id]');
    equipmentInputs.forEach(input => {
        const equipmentId = input.dataset.equipmentId;
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            assignedEquipment[equipmentId] = quantity;
        }
    });

    // Guardar los datos del equipo asignado en el objeto del viaje
    // Esto requiere que tu función saveTrip maneje este nuevo campo
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = trips.findIndex(t => t.id === tripId);
    if (tripIndex > -1) {
        trips[tripIndex].assignedEquipment = assignedEquipment;
        localStorage.setItem('trips', JSON.stringify(trips));
    }

    // Llamar a la función original de guardar viaje si existe
    if (originalSaveTrip) {
        originalSaveTrip(tripId);
    }
};

// =================================================================================
// == CÓDIGO PARA FUNCIONALIDAD DE COMPARTIR VIAJES (VERSIÓN FINAL) ==
// =================================================================================

let currentShareTripId = null;

function openShareTripModal(tripId) {
    currentShareTripId = tripId;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
        alert('Error: No se encontró el viaje para compartir.');
        return;
    }

    // Resetear checkboxes a valores por defecto
    const checkboxes = ['sh_name', 'sh_destination', 'sh_dates', 'sh_description', 'sh_promo', 'sh_price', 'sh_logistics', 'sh_transport', 'sh_accommodation', 'sh_meals', 'sh_includes', 'sh_excludes', 'sh_providers', 'sh_provider_contacts', 'sh_clients', 'sh_payments', 'sh_food_needs', 'sh_team', 'sh_expenses', 'sh_expenses_covered', 'sh_notes', 'sh_capacity'];
    const defaults = { sh_name: true, sh_destination: true, sh_dates: true, sh_description: true, sh_promo: false, sh_price: true, sh_logistics: true, sh_transport: false, sh_accommodation: false, sh_meals: false, sh_includes: true, sh_excludes: false, sh_providers: true, sh_provider_contacts: false, sh_clients: true, sh_payments: false, sh_food_needs: false, sh_team: false, sh_expenses: false, sh_expenses_covered: false, sh_notes: false, sh_capacity: false };
    
    checkboxes.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.checked = defaults[id];
    });

    // Limpiar campos de texto personalizados
    document.getElementById('shareTeamList').value = '';
    document.getElementById('shareExpensesCovered').value = '';
    document.getElementById('shareProviderContacts').value = '';

    // Actualizar vista previa inicial
    updateSharePreview();

    document.getElementById('shareTripModal').style.display = 'block';
}

function closeShareTripModal() {
    document.getElementById('shareTripModal').style.display = 'none';
}

function updateSharePreview() {
    const previewBox = document.getElementById('shareTripPreviewBox');
    let content = '';
    const trip = trips.find(t => t.id === currentShareTripId);
    if (!trip) {
        previewBox.innerText = 'No se pudo cargar la información del viaje.';
        return;
    }

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX');

    if (document.getElementById('sh_name')?.checked) content += `**Viaje:** ${trip.name}\n`;
    if (document.getElementById('sh_destination')?.checked) content += `**Destino:** ${trip.destination}\n`;
    if (document.getElementById('sh_dates')?.checked) content += `**Fechas:** ${formatDate(trip.startDate)} al ${formatDate(trip.endDate)}\n`;
    if (document.getElementById('sh_description')?.checked && trip.description) content += `**Descripción:** ${trip.description}\n`;
    if (document.getElementById('sh_promo')?.checked && trip.promoText) content += `**Promoción:** ${trip.promoText}\n`;
    if (document.getElementById('sh_price')?.checked) content += `**Precio por Persona:** $${trip.price.toFixed(2)}\n`;
    if (document.getElementById('sh_logistics')?.checked && trip.logistics) content += `**Itinerario/Logística:**\n${trip.logistics}\n`;
    if (document.getElementById('sh_transport')?.checked && trip.transport) content += `**Transporte:** ${trip.transport}\n`;
    if (document.getElementById('sh_accommodation')?.checked && trip.accommodation) content += `**Hospedaje:** ${trip.accommodation}\n`;
    if (document.getElementById('sh_meals')?.checked && trip.meals) content += `**Alimentación:** ${trip.meals}\n`;
    if (document.getElementById('sh_includes')?.checked && trip.includes && trip.includes.length > 0) content += `**Incluye:**\n- ${trip.includes.join('\n- ')}\n`;
    if (document.getElementById('sh_excludes')?.checked && trip.excludes && trip.excludes.length > 0) content += `**No Incluye:**\n- ${trip.excludes.join('\n- ')}\n`;
    if (document.getElementById('sh_providers')?.checked && trip.providers && trip.providers.length > 0) content += `**Proveedores:**\n- ${trip.providers.join('\n- ')}\n`;
    if (document.getElementById('sh_provider_contacts')?.checked) {
        const contacts = document.getElementById('shareProviderContacts').value;
        if (contacts) content += `**Contactos Proveedores:**\n${contacts}\n`;
    }
    if (document.getElementById('sh_clients')?.checked) {
        content += `**Pasajeros (${trip.clients ? trip.clients.length : 0}):**\n`;
        if (trip.clients && trip.clients.length > 0) {
            trip.clients.forEach(c => {
                let paymentStatus = c.paymentStatus || 'Pendiente';
                content += `- ${c.name} (Pago: ${paymentStatus})\n`;
            });
        }
    }
    if (document.getElementById('sh_payments')?.checked) {
        content += `**Estado de Pagos:** Ver detalles en el sistema.\n`;
    }
    if (document.getElementById('sh_food_needs')?.checked) {
        const specialFoodClients = trip.clients ? trip.clients.filter(c => c.food) : [];
        if (specialFoodClients.length > 0) {
            content += `**Req. Alimentarios Especiales:**\n`;
            specialFoodClients.forEach(c => content += `- ${c.name}\n`);
        }
    }
    if (document.getElementById('sh_team')?.checked) {
        const teamList = document.getElementById('shareTeamList').value;
        if (teamList) content += `**Equipo/Staff Asignado:**\n${teamList}\n`;
    }
    if (document.getElementById('sh_expenses')?.checked) {
        content += `**Gastos del Viaje:** Ver detalles en el sistema.\n`;
    }
    if (document.getElementById('sh_expenses_covered')?.checked) {
        const expenses = document.getElementById('shareExpensesCovered').value;
        if (expenses) content += `**Gastos Cubiertos por el Viaje:**\n${expenses}\n`;
    }
    if (document.getElementById('sh_notes')?.checked && trip.notes) content += `**Notas Internas:** ${trip.notes}\n`;
    if (document.getElementById('sh_capacity')?.checked && trip.capacity) content += `**Capacidad Máx.:** ${trip.capacity} personas\n`;

    previewBox.textContent = content || 'Selecciona los elementos que deseas incluir para ver la vista previa.';
}

function getShareText() {
    return document.getElementById('shareTripPreviewBox').textContent;
}

function copyShareText() {
    const text = getShareText();
    if (!text) {
        alert('No hay nada que copiar.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        alert('¡Texto copiado al portapapeles!');
    }).catch(err => {
        console.error('Error al copiar el texto: ', err);
        alert('No se pudo copiar el texto.');
    });
}

function shareViaWhatsApp() {
    const text = getShareText();
    if (!text) {
        alert('No hay nada que compartir.');
        return;
    }
    const phoneNumber = prompt('¿A qué número de WhatsApp quieres enviarlo? (Incluye lada, sin +)');
    if (phoneNumber && phoneNumber.trim() !== '') {
        const url = `https://wa.me/${phoneNumber.trim()}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
}

function shareToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Error: La librería para generar PDF no se cargó correctamente.');
        return;
    }

    const trip = trips.find(t => t.id === currentShareTripId);
    if (!trip) return;

    const doc = new jsPDF();
    const text = getShareText();
    const lines = doc.splitTextToSize(text, 180);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    let y = 20;
    lines.forEach(line => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 15, y);
        y += 7;
    });

    doc.save(`informacion-viaje-${trip.name.replace(/\s+/g, '_')}.pdf`);
    alert('PDF descargado correctamente.');
}

// --- EVENT LISTENER PARA COMPARTIR ---
document.addEventListener('DOMContentLoaded', function() {
    const shareModalCheckboxes = document.querySelectorAll('#shareTripModal input[type="checkbox"]');
    const shareModalTextareas = document.querySelectorAll('#shareTripModal textarea');
    
    shareModalCheckboxes.forEach(element => {
        element.addEventListener('change', updateSharePreview);
    });

    shareModalTextareas.forEach(element => {
        element.addEventListener('input', updateSharePreview);
    });
});
