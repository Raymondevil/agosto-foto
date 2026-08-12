// Client-side Application Logic for Fotografías El Tigre
let currentVideoPass = false;
let photoTypesCount = { digital: 0, fisica: 0, marco: 0 };
let galleryData = [];
let selectionGalleryData = [];
let currentFilter = 'all';
let selectedModalPhoto = null;
let adminAuthToken = null;

// Selected Photo Types for /seleccionar page: Map<photoId, 'digital' | 'fisica' | 'marco'>
let selectedPhotoMap = new Map();
let selectionVideoPass = false;

// Carousel State
let carouselItems = [];
let currentSlideIndex = 0;
let carouselTimer = null;

// DOM Load Initialization
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    loadEvents();
    loadGallery();
    initCarousel();
    initSelectionPage();
    initOrderForm();
    initContactForm();
    initAdminForm();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.add('hidden');
            });
        });
    }
}

// Fetch and Render Fiestas Patrias Program
async function loadEvents() {
    const container = document.getElementById('events-grid');
    if (!container) return;

    try {
        const response = await axios.get('/api/events');
        if (response.data && response.data.events) {
            const events = response.data.events;
            container.innerHTML = events.map(event => `
                <div class="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all hover:-translate-y-1 shadow-xl flex flex-col justify-between group">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                                <i class="fa-solid fa-calendar-day mr-1"></i> ${escapeHtml(event.date)}
                            </span>
                            <span class="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md">
                                ${escapeHtml(event.tag)}
                            </span>
                        </div>
                        <h3 class="font-serif font-black text-xl text-white group-hover:text-amber-300 transition-colors">
                            ${escapeHtml(event.title)}
                        </h3>
                        <p class="text-slate-300 text-xs leading-relaxed">
                            ${escapeHtml(event.description)}
                        </p>
                    </div>
                    <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span class="text-emerald-400 font-bold flex items-center gap-1">
                            <i class="fa-solid fa-camera-retro"></i> ${escapeHtml(event.badge)}
                        </span>
                        <a href="#cotizador" onclick="selectEventInForm('${escapeHtml(event.title)}')" class="text-amber-400 hover:underline font-bold">
                            Pedir Video/Foto →
                        </a>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error cargando eventos:', err);
    }
}

// Fetch and Render Gallery
async function loadGallery(searchQuery = '', dorsalQuery = '') {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    try {
        let url = '/api/gallery?category=' + encodeURIComponent(currentFilter);
        if (searchQuery) url += '&search=' + encodeURIComponent(searchQuery);
        if (dorsalQuery) url += '&dorsal=' + encodeURIComponent(dorsalQuery);

        const response = await axios.get(url);
        if (response.data && response.data.gallery) {
            galleryData = response.data.gallery;
            renderGallery();
        }
    } catch (err) {
        console.error('Error cargando galería:', err);
    }
}

function renderGallery() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    if (galleryData.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-12 space-y-2">
            <i class="fa-solid fa-magnifying-glass text-3xl text-amber-500/50 mb-2"></i>
            <p class="font-bold text-white">No se encontraron fotos o videos con ese criterio/dorsal.</p>
        </div>`;
        return;
    }

    container.innerHTML = galleryData.map(item => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/50 transition-all hover:-translate-y-1 group flex flex-col justify-between">
            <div class="relative aspect-video bg-black overflow-hidden cursor-pointer" onclick="openModal('${item.id}')">
                <img src="${item.url}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                    <i class="fa-solid fa-calendar mr-1"></i> ${escapeHtml(item.date)}
                </div>
                ${item.dorsal ? `
                <div class="absolute top-3 right-3 bg-slate-950/90 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Dorsal: #${escapeHtml(item.dorsal)}
                </div>
                ` : ''}
                <div class="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                    $${item.price} MXN
                </div>
            </div>
            <div class="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                    <h4 class="font-serif font-extrabold text-base text-white group-hover:text-amber-300 transition-colors">
                        ${escapeHtml(item.title)}
                    </h4>
                    <p class="text-slate-400 text-xs line-clamp-2 mt-1">
                        ${escapeHtml(item.description)}
                    </p>
                </div>
                <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button onclick="openModal('${item.id}')" class="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1">
                        <i class="fa-solid fa-expand text-amber-400"></i> Ver foto
                    </button>
                    <a href="#cotizador" onclick="addPhotoToCartDirect('${escapeHtml(item.title)}')" class="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all">
                        + Pedir ($50)
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Photo Carousel Implementation
async function initCarousel() {
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!track) return;

    try {
        const response = await axios.get('/api/gallery?type=photo');
        if (response.data && response.data.gallery) {
            carouselItems = response.data.gallery.slice(0, 6);
            if (carouselItems.length === 0) return;

            track.innerHTML = carouselItems.map((item, idx) => `
                <div class="min-w-[25%] relative aspect-video sm:aspect-[21/9] bg-black overflow-hidden flex-shrink-0">
                    <img src="${item.url}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 right-6 md:left-12 md:right-12 space-y-2 text-left">
                        <div class="flex items-center gap-2">
                            <span class="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase">
                                <i class="fa-solid fa-calendar mr-1"></i> ${escapeHtml(item.date)}
                            </span>
                            ${item.dorsal ? `<span class="bg-slate-950/90 text-amber-300 border border-amber-400/40 font-bold text-xs px-3 py-1 rounded-full">Dorsal: #${escapeHtml(item.dorsal)}</span>` : ''}
                        </div>
                        <h3 class="font-serif font-black text-2xl sm:text-4xl text-white drop-shadow-md">
                            ${escapeHtml(item.title)}
                        </h3>
                        <p class="text-slate-300 text-xs sm:text-sm line-clamp-2 max-w-2xl">
                            ${escapeHtml(item.description)}
                        </p>
                    </div>
                </div>
            `).join('');

            if (dotsContainer) {
                dotsContainer.innerHTML = carouselItems.map((_, idx) => `
                    <button onclick="goToSlide(${idx})" class="w-3 h-3 rounded-full transition-all ${idx === 0 ? 'bg-amber-500 w-8' : 'bg-slate-600'}" id="carousel-dot-${idx}"></button>
                `).join('');
            }

            startCarouselTimer();
        }
    } catch (e) {
        console.error('Error init carousel:', e);
    }
}

function updateCarouselPosition() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    track.style.transform = `translateX(-${currentSlideIndex * 25}%)`;

    carouselItems.forEach((_, idx) => {
        const dot = document.getElementById(`carousel-dot-${idx}`);
        if (dot) {
            if (idx === currentSlideIndex) {
                dot.className = 'w-8 h-3 rounded-full bg-amber-500 transition-all';
            } else {
                dot.className = 'w-3 h-3 rounded-full bg-slate-600 transition-all';
            }
        }
    });
}

function nextSlide() {
    if (carouselItems.length === 0) return;
    currentSlideIndex = (currentSlideIndex + 1) % carouselItems.length;
    updateCarouselPosition();
    resetCarouselTimer();
}

function prevSlide() {
    if (carouselItems.length === 0) return;
    currentSlideIndex = (currentSlideIndex - 1 + carouselItems.length) % carouselItems.length;
    updateCarouselPosition();
    resetCarouselTimer();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateCarouselPosition();
    resetCarouselTimer();
}

function startCarouselTimer() {
    carouselTimer = setInterval(nextSlide, 5000);
}

function resetCarouselTimer() {
    if (carouselTimer) clearInterval(carouselTimer);
    startCarouselTimer();
}

// Dedicated Checkbox Photo Selection Page ('/seleccionar') Logic
async function initSelectionPage() {
    const grid = document.getElementById('selection-photos-grid');
    if (!grid) return;

    try {
        const response = await axios.get('/api/gallery?type=photo');
        if (response.data && response.data.gallery) {
            selectionGalleryData = response.data.gallery;
            renderSelectionGrid();
        }
    } catch (err) {
        console.error('Error cargando selección:', err);
    }
}

function renderSelectionGrid() {
    const grid = document.getElementById('selection-photos-grid');
    if (!grid) return;

    if (selectionGalleryData.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-12">No hay fotos disponibles para seleccionar.</div>`;
        return;
    }

    grid.innerHTML = selectionGalleryData.map(item => {
        const currentType = selectedPhotoMap.get(item.id) || null;
        return `
            <div id="selection-card-${item.id}" class="bg-slate-900 border-2 ${currentType ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800'} rounded-2xl overflow-hidden shadow-xl transition-all relative group flex flex-col justify-between">

                <div class="relative aspect-video bg-black overflow-hidden cursor-pointer" onclick="openModal('${item.id}')">
                    <img src="${item.url}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <div class="absolute top-3 right-3 bg-slate-950/80 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                        ${item.dorsal ? `Dorsal: #${escapeHtml(item.dorsal)}` : escapeHtml(item.date)}
                    </div>
                </div>

                <div class="p-4 space-y-3 flex-grow flex flex-col justify-between">
                    <div>
                        <h4 class="font-serif font-black text-base text-white">${escapeHtml(item.title)}</h4>
                        <p class="text-slate-400 text-xs line-clamp-2 mt-1">${escapeHtml(item.description)}</p>
                    </div>

                    <!-- OPCIONES DE FORMATO -->
                    <div class="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider">Elige formato de compra:</span>
                        <div class="grid grid-cols-3 gap-1 text-[11px] font-bold">
                            <button onclick="setPhotoFormat('${item.id}', 'digital')" class="py-1.5 px-1 rounded-lg border transition-all text-center ${currentType === 'digital' ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'}">
                                Digital<br><span class="${currentType === 'digital' ? 'text-slate-950' : 'text-emerald-400'}">$30</span>
                            </button>
                            <button onclick="setPhotoFormat('${item.id}', 'fisica')" class="py-1.5 px-1 rounded-lg border transition-all text-center ${currentType === 'fisica' ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'}">
                                Física<br><span class="${currentType === 'fisica' ? 'text-slate-950' : 'text-emerald-400'}">$50</span>
                            </button>
                            <button onclick="setPhotoFormat('${item.id}', 'marco')" class="py-1.5 px-1 rounded-lg border transition-all text-center ${currentType === 'marco' ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'}">
                                C/Marco<br><span class="${currentType === 'marco' ? 'text-slate-950' : 'text-emerald-400'}">$70</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateSelectionSummary();
}

function setPhotoFormat(photoId, type) {
    if (selectedPhotoMap.get(photoId) === type) {
        selectedPhotoMap.delete(photoId); // Deseleccionar al hacer click de nuevo
    } else {
        selectedPhotoMap.set(photoId, type);
    }
    renderSelectionGrid();
}

function selectAllPhotos(check) {
    if (check) {
        selectionGalleryData.forEach(item => selectedPhotoMap.set(item.id, 'digital'));
    } else {
        selectedPhotoMap.clear();
    }
    renderSelectionGrid();
}

function filterSelectionGrid() {
    const input = document.getElementById('selection-search');
    if (!input) return;
    const query = input.value.trim().toLowerCase();

    const filtered = selectionGalleryData.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.dorsal && item.dorsal.toLowerCase().includes(query))
    );

    const grid = document.getElementById('selection-photos-grid');
    if (!grid) return;

    grid.innerHTML = filtered.map(item => {
        const currentType = selectedPhotoMap.get(item.id) || null;
        return `
            <div id="selection-card-${item.id}" class="bg-slate-900 border-2 ${currentType ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800'} rounded-2xl overflow-hidden shadow-xl transition-all relative group flex flex-col justify-between">
                <div class="relative aspect-video bg-black overflow-hidden cursor-pointer" onclick="openModal('${item.id}')">
                    <img src="${item.url}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover">
                </div>
                <div class="p-4 space-y-2">
                    <h4 class="font-serif font-black text-base text-white">${escapeHtml(item.title)}</h4>
                    <div class="grid grid-cols-3 gap-1 text-[11px] font-bold">
                        <button onclick="setPhotoFormat('${item.id}', 'digital')" class="py-1 px-1 rounded border ${currentType === 'digital' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-300'}">Dig $30</button>
                        <button onclick="setPhotoFormat('${item.id}', 'fisica')" class="py-1 px-1 rounded border ${currentType === 'fisica' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-300'}">Fís $50</button>
                        <button onclick="setPhotoFormat('${item.id}', 'marco')" class="py-1 px-1 rounded border ${currentType === 'marco' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-300'}">Marco $70</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleSelectionVideoPass() {
    const check = document.getElementById('selection-video-pass-check');
    if (check) {
        selectionVideoPass = check.checked;
        updateSelectionSummary();
    }
}

function updateSelectionSummary() {
    const countBadge = document.getElementById('selected-count-badge');
    const priceEl = document.getElementById('selection-total-price');

    let totalPhotosPrice = 0;
    let counts = { digital: 0, fisica: 0, marco: 0 };

    selectedPhotoMap.forEach((type) => {
        if (type === 'digital') { totalPhotosPrice += 30; counts.digital++; }
        else if (type === 'fisica') { totalPhotosPrice += 50; counts.fisica++; }
        else if (type === 'marco') { totalPhotosPrice += 70; counts.marco++; }
    });

    const grandTotal = totalPhotosPrice + (selectionVideoPass ? 600 : 0);

    if (countBadge) countBadge.innerText = `${selectedPhotoMap.size} foto(s) seleccionadas`;
    if (priceEl) priceEl.innerText = `$${grandTotal} MXN`;
}

// Send Batch WhatsApp Order from /seleccionar
function sendBatchWhatsAppOrder() {
    if (selectedPhotoMap.size === 0 && !selectionVideoPass) {
        alert('Por favor selecciona el formato de al menos una foto (Digital, Física o Marco) o activa el paquete de video.');
        return;
    }

    let selectedList = [];
    let photosTotal = 0;

    selectedPhotoMap.forEach((type, photoId) => {
        const item = selectionGalleryData.find(g => g.id === photoId);
        if (item) {
            let typeLabel = '';
            let price = 0;
            if (type === 'digital') { typeLabel = 'Digital HD ($30 MXN)'; price = 30; }
            else if (type === 'fisica') { typeLabel = 'Impresa Física ($50 MXN)'; price = 50; }
            else if (type === 'marco') { typeLabel = 'Física c/Marco Personalizado ($70 MXN)'; price = 70; }

            photosTotal += price;
            selectedList.push(`📸 *${item.title}* -> Formato: ${typeLabel}`);
        }
    });

    const grandTotal = photosTotal + (selectionVideoPass ? 600 : 0);

    let message = `*PEDIDO / SELECCIÓN MASIVA DE FOTOS EL TIGRE*\n\n`;
    message += `📋 *FOTOS SELECCIONADAS (${selectedPhotoMap.size} fotos):*\n`;
    selectedList.forEach(t => message += `${t}\n`);

    if (selectionVideoPass) {
        message += `\n🎥 *Paquete Completo de Videos (Todos los Días):* $600 MXN\n`;
    }

    message += `\n💰 *TOTAL A PAGAR:* $${grandTotal} MXN\n`;
    message += `\n📍 *Lugar de Entrega / Informes:* Carpintería El Tigre, San Pedro Lagunillas, Nayarit.\n`;
    message += `\n¡Por favor envíenme estas fotos con los formatos seleccionados!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/523118470860?text=${encoded}`, '_blank');
}

// Pay Batch Mercado Pago from /seleccionar
async function payBatchMercadoPago() {
    if (selectedPhotoMap.size === 0 && !selectionVideoPass) {
        alert('Por favor selecciona al menos una foto o el paquete de video.');
        return;
    }

    let photosTotal = 0;
    selectedPhotoMap.forEach((type) => {
        if (type === 'digital') photosTotal += 30;
        else if (type === 'fisica') photosTotal += 50;
        else if (type === 'marco') photosTotal += 70;
    });

    const grandTotal = photosTotal + (selectionVideoPass ? 600 : 0);

    try {
        const res = await axios.post('/api/payment/mercadopago', {
            clientName: 'Cliente Selección Checkbox',
            phone: '3118470860',
            videoPass: selectionVideoPass,
            photoCount: selectedPhotoMap.size,
            selectedPhotoIds: Array.from(selectedPhotoMap.keys()),
            total: grandTotal
        });

        if (res.data && res.data.success) {
            window.open(res.data.initPoint, '_blank');
        } else {
            alert('Error generando el enlace de Mercado Pago.');
        }
    } catch (e) {
        alert('Error conectando con Mercado Pago.');
    }
}

// Search by Dorsal
function searchByDorsal() {
    const input = document.getElementById('dorsal-search-input');
    if (!input) return;
    const query = input.value.trim();
    loadGallery(query, query);
}

// Lightbox Modal
function openModal(itemId) {
    const item = galleryData.find(g => g.id === itemId);
    if (!item) return;

    selectedModalPhoto = item;
    const modal = document.getElementById('photo-modal');
    document.getElementById('modal-img').src = item.url;
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-date').querySelector('span').innerText = item.date;
    document.getElementById('modal-desc').innerText = item.description;
    document.getElementById('modal-price').innerText = `$${item.price} MXN`;
    document.getElementById('modal-badge').innerText = item.type === 'video' ? 'Video Paquete' : 'Foto HD Individual';
    document.getElementById('modal-dorsal-tag').innerText = item.dorsal ? `Dorsal: #${item.dorsal}` : 'General';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('photo-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    selectedModalPhoto = null;
}

function addPhotoFromModal() {
    if (selectedModalPhoto) {
        addPhotoToCartDirect(selectedModalPhoto.title);
        closeModal();
    }
}

// Interactive Order Form Logic
function initOrderForm() {
    const checkVideo = document.getElementById('check-video-pass');
    if (checkVideo) {
        checkVideo.addEventListener('change', (e) => {
            currentVideoPass = e.target.checked;
            recalculateTotal();
        });
    }

    const btnWhatsApp = document.getElementById('btn-send-whatsapp');
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener('click', sendOrderViaWhatsApp);
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}

function adjustPhotos(delta) {
    currentPhotosCount = Math.max(0, currentPhotosCount + delta);
    document.getElementById('photo-count-display').innerText = currentPhotosCount;
    document.getElementById('photo-subtotal').innerText = currentPhotosCount * 50;
    recalculateTotal();
}

function addPhotoToCartDirect(title) {
    currentPhotosCount++;
    document.getElementById('photo-count-display').innerText = currentPhotosCount;
    document.getElementById('photo-subtotal').innerText = currentPhotosCount * 50;

    const notesInput = document.getElementById('order-notes');
    if (notesInput) {
        const currentText = notesInput.value.trim();
        if (!currentText.includes(title)) {
            notesInput.value = currentText ? `${currentText}, incluir foto "${title}"` : `Incluir foto: "${title}"`;
        }
    }
    recalculateTotal();
}

function selectPackage(type) {
    if (type === 'video') {
        const checkVideo = document.getElementById('check-video-pass');
        if (checkVideo) {
            checkVideo.checked = true;
            currentVideoPass = true;
        }
    } else if (type === 'photo') {
        if (currentPhotosCount === 0) {
            adjustPhotos(1);
        }
    }
    recalculateTotal();
}

function selectEventInForm(eventTitle) {
    const notesInput = document.getElementById('order-notes');
    if (notesInput) {
        const currentText = notesInput.value.trim();
        if (!currentText.includes(eventTitle)) {
            notesInput.value = currentText ? `${currentText}. Me interesa el evento: ${eventTitle}` : `Me interesa el evento: ${eventTitle}`;
        }
    }
}

function recalculateTotal() {
    const grandTotal = (currentVideoPass ? 600 : 0) + (currentPhotosCount * 50);
    const totalEl = document.getElementById('grand-total');
    if (totalEl) totalEl.innerText = grandTotal;
}

// Generate & Send WhatsApp Order to 3118470860
function sendOrderViaWhatsApp() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    if (!name || !phone) {
        showOrderStatus('Por favor completa tu Nombre y Teléfono antes de enviar por WhatsApp.', 'error');
        return;
    }

    const total = (currentVideoPass ? 600 : 0) + (currentPhotosCount * 50);

    let message = `*PEDIDO / COTIZACIÓN FOTOGRAFÍAS EL TIGRE*\n\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `📞 *Teléfono:* ${phone}\n\n`;
    message += `📋 *PRODUCTOS SELECCIONADOS:*\n`;

    if (currentVideoPass) {
        message += `✅ *Paquete Completo de Videos (Todos los Días):* $600 MXN\n`;
    }

    if (currentPhotosCount > 0) {
        message += `📸 *Fotos Individuales HD:* ${currentPhotosCount} foto(s) ($${currentPhotosCount * 50} MXN)\n`;
    }

    if (notes) {
        message += `\n✏️ *Notas / Dorsal / Solicitudes:* ${notes}\n`;
    }

    message += `\n💰 *TOTAL ESTIMADO:* $${total} MXN\n`;
    message += `\n📍 *Lugar de Entrega / Informes:* Carpintería El Tigre, San Pedro Lagunillas, Nayarit.\n`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/523118470860?text=${encodedMsg}`, '_blank');
    showOrderStatus('¡Mensaje de WhatsApp preparado correctamente!', 'success');
}

// Handle Order Submit
async function handleOrderSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'WhatsApp / Efectivo';

    if (!name || !phone) {
        showOrderStatus('Por favor ingresa tu nombre y teléfono.', 'error');
        return;
    }

    const total = (currentVideoPass ? 600 : 0) + (currentPhotosCount * 50);

    if (paymentMethod === 'Mercado Pago') {
        processMercadoPagoCheckout(name, phone, notes, total);
        return;
    }

    const btn = document.getElementById('btn-save-online');
    btn.disabled = true;

    try {
        const response = await axios.post('/api/orders', {
            clientName: name,
            phone: phone,
            videoPass: currentVideoPass,
            photoCount: currentPhotosCount,
            notes: notes,
            paymentMethod: paymentMethod
        });

        if (response.data && response.data.success) {
            showOrderStatus(`¡Solicitud ${response.data.order.id} registrada con éxito! Puedes mandar WhatsApp al 311 847 0860 para acelerar la entrega.`, 'success');
        } else {
            showOrderStatus(response.data.error || 'Error al registrar tu solicitud.', 'error');
        }
    } catch (err) {
        showOrderStatus('Error al conectar con el servidor.', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function processMercadoPagoCheckout(name, phone, notes, total) {
    if (total <= 0) {
        showOrderStatus('Selecciona al menos una foto o el paquete de video para pagar.', 'error');
        return;
    }

    try {
        const res = await axios.post('/api/payment/mercadopago', {
            clientName: name,
            phone: phone,
            videoPass: currentVideoPass,
            photoCount: currentPhotosCount,
            total: total
        });

        if (res.data && res.data.success) {
            document.getElementById('mp-modal-total').innerText = `$${total} MXN`;
            document.getElementById('mp-checkout-link').href = res.data.initPoint;
            openMpModal();
        }
    } catch (err) {
        showOrderStatus('Error de conexión con Mercado Pago.', 'error');
    }
}

function openMpModal() {
    const modal = document.getElementById('mercadopago-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeMpModal() {
    const modal = document.getElementById('mercadopago-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function openAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function loginAdmin() {
    const passInput = document.getElementById('admin-pass-input');
    const msgEl = document.getElementById('admin-login-msg');
    const pass = passInput.value.trim();

    try {
        const res = await axios.post('/api/admin/login', { password: pass });
        if (res.data && res.data.success) {
            adminAuthToken = res.data.token;
            document.getElementById('admin-login-step').classList.add('hidden');
            document.getElementById('admin-upload-form').classList.remove('hidden');
        } else {
            msgEl.innerText = res.data.error || 'Contraseña incorrecta';
            msgEl.className = 'text-xs text-center font-bold text-red-400 block';
        }
    } catch (err) {
        msgEl.innerText = 'Contraseña incorrecta. Intenta tigre2026';
        msgEl.className = 'text-xs text-center font-bold text-red-400 block';
    }
}

function initAdminForm() {
    const form = document.getElementById('admin-upload-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('admin-upload-msg');

        const title = document.getElementById('upload-title').value.trim();
        const category = document.getElementById('upload-category').value;
        const date = document.getElementById('upload-date').value.trim();
        const price = document.getElementById('upload-price').value;
        const url = document.getElementById('upload-url').value.trim();
        const videoUrl = document.getElementById('upload-video-url')?.value.trim() || '';
        const dorsal = document.getElementById('upload-dorsal').value.trim();
        const desc = document.getElementById('upload-desc').value.trim();

        try {
            const res = await axios.post('/api/admin/upload', {
                password: 'tigre2026',
                title: title,
                category: category,
                date: date,
                price: price,
                url: url,
                videoUrl: videoUrl,
                dorsal: dorsal,
                description: desc
            }, {
                headers: { Authorization: `Bearer ${adminAuthToken}` }
            });

            if (res.data && res.data.success) {
                msgEl.innerText = '¡Foto / Video publicado exitosamente en D1!';
                msgEl.className = 'text-xs text-center font-bold p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 block';
                form.reset();
                loadGallery();
            } else {
                msgEl.innerText = res.data.error || 'Error al subir foto';
                msgEl.className = 'text-xs text-center font-bold p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/50 block';
            }
        } catch (err) {
            msgEl.innerText = 'Error al subir la imagen a la base de datos.';
            msgEl.className = 'text-xs text-center font-bold p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/50 block';
        }
    });
}

function showOrderStatus(msg, type) {
    const el = document.getElementById('order-status-msg');
    if (!el) return;

    el.innerText = msg;
    el.classList.remove('hidden', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/50', 'bg-red-500/20', 'text-red-300', 'border-red-500/50');

    if (type === 'success') {
        el.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/50');
    } else {
        el.classList.add('bg-red-500/20', 'text-red-300', 'border', 'border-red-500/50');
    }
}

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const message = document.getElementById('contact-msg').value.trim();

        const statusEl = document.getElementById('contact-status-msg');

        try {
            const response = await axios.post('/api/contact', { name, phone, message });
            if (response.data && response.data.success) {
                statusEl.innerText = '¡Mensaje enviado con éxito!';
                statusEl.className = 'p-3 rounded-xl text-center text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 block';
                contactForm.reset();
            }
        } catch (err) {
            statusEl.innerText = 'Error de conexión. Intenta llamarnos o mandar WhatsApp al 311 847 0860.';
            statusEl.className = 'p-3 rounded-xl text-center text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/50 block';
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
