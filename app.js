// ==================== Configuration ====================
const CONFIG = {
    center: [-22.7128, -43.5547], // Queimados coordinates [lat, lng]
    zoom: 13,
    minZoom: 11,
    maxZoom: 18,
    basemaps: {
        streets: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '© Esri'
        },
        terrain: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: '© OpenTopoMap contributors'
        }
    },
    layers: {
        bairros: {
            file: 'data/bairros_que.geojson',
            color: '#667eea',
            name: 'Bairros'
        },
        setores: {
            file: 'data/setores_que.geojson',
            color: '#f093fb',
            name: 'Setores Censitários'
        },
        urb_rur: {
            file: 'data/urb_rur_que.geojson',
            color: '#4facfe',
            name: 'Urbano / Rural'
        },
        deficit_hab: {
            file: 'data/deficit_hab_que.geojson',
            color: '#fa709a',
            name: 'Déficit Habitacional'
        },
        residencia: {
            file: 'data/residencias_que.geojson',
            color: '#43e97b',
            name: 'Residências'
        }
    }
};

// ==================== Global Variables ====================
let map;
let currentBasemap = 'streets';
let basemapLayers = {};
let dataLayers = {};
let loadingIndicator;
let selectedAttributes = new Set([
    'CD_SETOR',
    'NM_MUN',
    'NM_DIST',
    'AREA_KM2',
    'v0001',
    'v0002',
    'v0003',
    'v0004',
    'v0005',
    'v0006',
    'v0007'
]);
let currentThematicAttribute = null;
let thematicBreaks = [];
let thematicColors = [];
let bairroDataCache = {};

// Define all attributes with friendly names
const attributeLabels = {
    'CD_SETOR': 'Código do Setor',
    'CD_REGIAO': 'Código da Região',
    'NM_REGIAO': 'Nome da Região',
    'CD_UF': 'Código da UF',
    'NM_UF': 'Nome da UF',
    'CD_MUN': 'Código do Município',
    'NM_MUN': 'Nome do Município',
    'CD_DIST': 'Código do Distrito',
    'NM_DIST': 'Nome do Distrito',
    'CD_SUBDIST': 'Código do Subdistrito',
    'NM_SUBDIST': 'Nome do Subdistrito',
    'CD_BAIRRO': 'Código do Bairro',
    'NM_BAIRRO': 'Nome do Bairro',
    'AREA_KM2': 'Área (km²)',
    'v0001': 'População Total',
    'v0002': 'Domicílios Particulares',
    'v0003': 'Domicílios Particulares Ocupados',
    'v0004': 'Domicílios Particulares Vagos',
    'v0005': 'Moradores por Domicílio',
    'v0006': 'Área Média por Domicílio (km²)',
    'v0007': 'Densidade Demográfica (hab/km²)',
    'Residências ': 'Residências',
    '15-29 Analfabetos': 'Analfabetos (15-29 anos)',
    '30-59 Analfabetos': 'Analfabetos (30-59 anos)',
    '60+ Analfabetos': 'Analfabetos (60+ anos)',
    'Total_Analfabetos': 'Total de Analfabetos',
    '0 a 4 anos': 'População (0-4 anos)',
    '5 a 9 anos': 'População (5-9 anos)',
    '9 a 14 anos': 'População (9-14 anos)',
    '70 anos +': 'População (70+ anos)',
    'Total de crianças de 0 - 14 anos e idoso + 70 anos': 'Total Crianças e Idosos',
    'Branca': 'Raça/Cor Branca',
    'Preta': 'Raça/Cor Preta',
    'Amarela': 'Raça/Cor Amarela',
    'Parda': 'Raça/Cor Parda',
    'Indígena': 'Raça/Cor Indígena',
    'Pessoas responsáveis em domicílios particulares permanentes ocupados': 'Pessoas Responsáveis (Total)',
    'Valor do rendimento nominal médio mensal das pessoas responsáveis': 'Rendimento Médio Mensal',
    'Utiliza rede geral de distribuição': 'Abast. Rede Geral',
    'Utiliza poço profundo ou artesiano': 'Abast. Poço Profundo',
    'Utiliza poço raso, freático ou cacimba': 'Abast. Poço Raso',
    'Utiliza fonte, nascente ou mina': 'Abast. Fonte/Nascente',
    'Utiliza carro-pipa': 'Abast. Carro-Pipa',
    'Utiliza água da chuva armazenada': 'Abast. Água da Chuva',
    'Utiliza rios, açudes, córregos, lagos e igarapés': 'Abast. Rios/Lagos',
    'Total que não utiliza Rede geral de distribuição': 'Sem Rede Geral de Água',
    'Rede geral ou pluvial': 'Esgoto Rede Geral',
    'fossa séptica ou fossa filtro ligada à rede': 'Fossa Séptica (Ligada)',
    'fossa séptica ou fossa filtro não ligada à rede': 'Fossa Séptica (Não Ligada)',
    'Fossa rudimentar ou buraco': 'Fossa Rudimentar',
    'Vala': 'Esgoto Vala',
    'Rio, lago, córrego ou mar': 'Esgoto Rio/Lago',
    'Não utilizam a rede geral ou pluvial': 'Sem Rede de Esgoto',
    'Lixo coletado no domicílio por serviço de limpeza': 'Lixo Coletado no Domicílio',
    'Lixo depositado em caçamba de serviço de limpeza': 'Lixo em Caçamba',
    'Lixo queimado na propriedade': 'Lixo Queimado',
    'Lixo enterrado na propriedade': 'Lixo Enterrado',
    'Lixo jogado em terreno baldio, encosta ou área pública': 'Lixo Jogado Fora',
    'Lixo não coletado por serviço de limpeza': 'Lixo Não Coletado',
    'Casa': 'Tipo Casa',
    'Casa de vila ou em condomínio': 'Tipo Casa de Vila/Cond.',
    'apartamento': 'Tipo Apartamento',
    'habitação em casa de cômodos ou cortiço': 'Tipo Cômodos/Cortiço',
    'Estrutura residencial permanente degradada ou inacabada': 'Estrutura Degradada',
    'Moradias temporárias e improvisadas': 'Moradias Improvisadas'
};

// ==================== Initialize Map ====================
function initMap() {
    // Create map
    map = L.map('map', {
        center: CONFIG.center,
        zoom: CONFIG.zoom,
        minZoom: CONFIG.minZoom,
        maxZoom: CONFIG.maxZoom,
        zoomControl: false,
        attributionControl: true
    });

    // Add initial basemap
    addBasemap('streets');

    // Load data layers
    loadDataLayers();

    // Setup event listeners
    setupEventListeners();
}

// ==================== Basemap Management ====================
function addBasemap(basemapName) {
    // Remove existing basemap
    if (basemapLayers[currentBasemap]) {
        map.removeLayer(basemapLayers[currentBasemap]);
    }

    // Add new basemap
    if (!basemapLayers[basemapName]) {
        const config = CONFIG.basemaps[basemapName];
        basemapLayers[basemapName] = L.tileLayer(config.url, {
            attribution: config.attribution,
            maxZoom: CONFIG.maxZoom
        });
    }

    basemapLayers[basemapName].addTo(map);
    currentBasemap = basemapName;

    // Update UI
    document.querySelectorAll('.basemap-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-basemap="${basemapName}"]`).classList.add('active');
}

// ==================== Data Layer Management ====================
async function loadDataLayers() {
    showLoading();

    try {
        // Load bairros layer by default
        await loadLayer('bairros');
        hideLoading();
    } catch (error) {
        console.error('Error loading initial layers:', error);
        hideLoading();
        alert('Erro ao carregar camadas. Verifique o console para mais detalhes.');
    }
}

async function loadLayer(layerName) {
    if (dataLayers[layerName]) {
        return dataLayers[layerName]; // Already loaded
    }

    try {
        const config = CONFIG.layers[layerName];
        console.log(`Loading layer: ${layerName} from ${config.file}`);

        const response = await fetch(config.file);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const geojsonData = await response.json();
        console.log(`Layer ${layerName} loaded successfully with ${geojsonData.features?.length || 0} features`);

        const layer = L.geoJSON(geojsonData, {
            style: feature => getFeatureStyle(feature, config.color),
            pointToLayer: (feature, latlng) => {
                // For point geometries (like residencias), create circle markers
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: config.color,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7
                });
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    mouseover: highlightFeatureFixed,
                    mouseout: resetHighlight,
                    click: showFeatureInfo
                });

                // Add permanent label for bairros (neighborhoods)
                if (layerName === 'bairros' && feature.properties.NM_BAIRRO) {
                    const label = feature.properties.NM_BAIRRO;
                    layer.bindTooltip(label, {
                        permanent: true,
                        direction: 'center',
                        className: 'neighborhood-label'
                    });
                }
            }
        });

        dataLayers[layerName] = layer;

        // Apply black borders to bairros layer
        if (layerName === 'bairros') {
            layer.eachLayer(feature => {
                feature.setStyle({
                    color: '#000000',  // Black borders
                    weight: 2
                });
            });
        }

        // Add to map if checkbox is checked
        const checkbox = document.getElementById(`layer-${layerName}`);
        if (checkbox && checkbox.checked) {
            layer.addTo(map);
            console.log(`Layer ${layerName} added to map`);
        }

        return layer;
    } catch (error) {
        console.error(`Error loading layer ${layerName}:`, error);
        alert(`Erro ao carregar camada ${layerName}: ${error.message}\n\nVerifique se o arquivo ${CONFIG.layers[layerName].file} existe.`);
        throw error;
    }
}

function getFeatureStyle(feature, color) {
    return {
        fillColor: color,
        weight: 2,
        opacity: 1,
        color: color,
        dashArray: '',
        fillOpacity: 0.3
    };
}

function highlightFeatureFixed(e) {
    const layer = e.target;
    const currentFillColor = layer.options.fillColor;
    const currentFillOpacity = layer.options.fillOpacity;

    if (layer instanceof L.CircleMarker) {
        layer.setStyle({
            radius: 8,
            weight: 3,
            color: '#ffffff',
            fillOpacity: currentFillOpacity,
            fillColor: currentFillColor
        });
    } else {
        const style = {
            weight: 3,
            color: '#ffffff',
            dashArray: '',
            fillOpacity: currentFillOpacity // Mantém a opacidade original
        };

        layer.setStyle(style);
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    const layer = e.target;
    const layerName = getLayerName(layer);

    // Check if it's a circle marker (point)
    const isCircleMarker = layer instanceof L.CircleMarker;

    // If thematic mapping is active, restore thematic color
    if (currentThematicAttribute && layerName === 'setores') {
        const value = layer.feature.properties[currentThematicAttribute];
        const color = getColorForValue(value, thematicBreaks, thematicColors);

        layer.setStyle({
            fillColor: color,
            weight: 1,
            opacity: 1,
            color: '#000000',
            fillOpacity: 0.7
        });
    } else {
        // Otherwise, restore original style
        const config = CONFIG.layers[layerName];
        if (config) {
            if (isCircleMarker) {
                layer.setStyle({
                    radius: 6,
                    fillColor: config.color,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7
                });
            } else {
                layer.setStyle(getFeatureStyle(layer.feature, config.color));
                if (layerName === 'bairros') {
                    layer.setStyle({
                        color: '#000000',  // Restore black border
                        weight: 2
                    });
                }
            }
        }
    }
}

function getLayerName(layer) {
    for (const [name, dataLayer] of Object.entries(dataLayers)) {
        if (dataLayer.hasLayer(layer)) {
            return name;
        }
    }
    return null;
}

function showFeatureInfo(e) {
    const layer = e.target;
    const feature = layer.feature;
    const props = feature.properties;
    const layerName = getLayerName(layer);

    let content = '<div class="popup-content">';

    // Formatters can be used by multiple logic paths
    const format = (value, decimalPlaces = 2) => {
        if (value === undefined || value === null) return 'N/A';
        const num = parseFloat(value);
        if (isNaN(num)) return 'N/A';
        return num.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
    };

    const formatInt = (value) => {
        if (value === undefined || value === null) return 'N/A';
        const num = parseInt(value, 10);
        if (isNaN(num)) return 'N/A';
        return num.toLocaleString('pt-BR');
    };

    if (layerName === 'bairros') {
        const bairroNome = props.NM_BAIRRO;

        // Check cache first
        if (bairroDataCache[bairroNome]) {
            content += bairroDataCache[bairroNome];
            finalizePopup(content, e.latlng);
            return;
        }

        // If not in cache, calculate
        const setoresLayer = dataLayers.setores;
        if (!setoresLayer || typeof turf === 'undefined') {
            content += '<p>Dados dos setores não disponíveis ou Turf.js não carregado.</p>';
            finalizePopup(content, e.latlng);
            return;
        }

        let aggregatedData = {
            v0001: 0, v0002: 0, v0003: 0, v0004: 0,
            v0005: 0, v0006: 0, v0007: 0, count: 0
        };

        const bairroPolygon = feature;

        setoresLayer.eachLayer(setorLayer => {
            const setorFeature = setorLayer.feature;
            const pointInSetor = turf.pointOnFeature(setorFeature);

            if (turf.booleanPointInPolygon(pointInSetor, bairroPolygon)) {
                const setorProps = setorFeature.properties;
                aggregatedData.v0001 += parseFloat(setorProps.v0001) || 0;
                aggregatedData.v0002 += parseFloat(setorProps.v0002) || 0;
                aggregatedData.v0003 += parseFloat(setorProps.v0003) || 0;
                aggregatedData.v0004 += parseFloat(setorProps.v0004) || 0;
                aggregatedData.v0005 += parseFloat(setorProps.v0005) || 0;
                aggregatedData.v0006 += parseFloat(setorProps.v0006) || 0;
                aggregatedData.v0007 += parseFloat(setorProps.v0007) || 0;
                aggregatedData.count++;
            }
        });
        
        if (aggregatedData.count > 0) {
            aggregatedData.v0005 /= aggregatedData.count; // Average
        }

        let popupBody = `
            <div class="popup-header" style="background-color: ${CONFIG.layers.bairros.color};">
                <strong>${props.NM_BAIRRO || 'Bairro sem nome'}</strong>
            </div>
            <div class="popup-body">
                <p><strong>Município:</strong> ${props.NM_MUN || 'N/A'}</p>
                <p><strong>Distrito:</strong> ${props.NM_DIST || 'N/A'}</p>
                <p><strong>Bairro:</strong> ${props.NM_BAIRRO || 'N/A'}</p>
                <p><strong>Área (km²):</strong> ${format(props.AREA_KM2, 2)}</p>
                <p><strong>População Total:</strong> ${formatInt(aggregatedData.v0001)}</p>
                <p><strong>Domicílios Particulares:</strong> ${formatInt(aggregatedData.v0002)}</p>
                <p><strong>Domicílios Ocupados:</strong> ${formatInt(aggregatedData.v0003)}</p>
                <p><strong>Domicílios Vagos:</strong> ${formatInt(aggregatedData.v0004)}</p>
                <p><strong>Moradores por Domicílio:</strong> ${format(aggregatedData.v0005, 1)}</p>
                <p><strong>Área Média (km²):</strong> ${format(aggregatedData.v0006, 4)}</p>
                <p><strong>Densidade Demográfica:</strong> ${format(aggregatedData.v0007, 2)}</p>
            </div>
        `;
        content += popupBody;
        bairroDataCache[bairroNome] = popupBody; // Cache the result

    } else if (layerName === 'setores') {
        populateAttributeTable(props);
        
        let popupBody = '';

        if (selectedAttributes.size > 0) {
            for (const attributeKey of selectedAttributes) {
                const attributeName = attributeLabels[attributeKey] || attributeKey;
                const rawValue = props[attributeKey];
                let value = 'N/A';

                if (!(rawValue === null || rawValue === undefined || rawValue === '')) {
                    if (['v0001', 'v0002', 'v0003', 'v0004'].includes(attributeKey)) {
                        value = formatInt(rawValue);
                    } else if (attributeKey === 'AREA_KM2') {
                        value = format(rawValue, 2);
                    } else if (attributeKey === 'v0005') {
                        value = format(rawValue, 1);
                    } else if (attributeKey === 'v0006') {
                        value = format(rawValue, 4);
                    } else if (attributeKey === 'v0007') {
                        value = format(rawValue, 2);
                    } else {
                        value = rawValue;
                    }
                }

                popupBody += `<p><strong>${attributeName}:</strong> ${value}</p>`;
            }
        } else {
            popupBody = '<p>Nenhum atributo selecionado para exibição.</p>';
        }

        content += `
            <div class="popup-header" style="background-color: ${currentThematicAttribute ? layer.options.fillColor : CONFIG.layers.setores.color};">
                <strong>Setor Censitário</strong>
            </div>
            <div class="popup-body">
                ${popupBody}
            </div>
        `;
    } else {
        const config = CONFIG.layers[layerName] || {};
        const color = layer.options.fillColor || config.color || '#4a4a4a';
        const title = props.name || props.Name || props.NAME || config.name || 'Detalhes';
        
        content += `
            <div class="popup-header" style="background-color: ${color};">
                <strong>${title}</strong>
            </div>
            <div class="popup-body">
        `;
        for (const key in props) {
            if (Object.prototype.hasOwnProperty.call(props, key) && key !== 'geometry') {
                content += `<p><strong>${key}:</strong> ${props[key]}</p>`;
            }
        }
        content += '</div>';
    }

    content += '</div>';
    finalizePopup(content, e.latlng);
}

function finalizePopup(content, latlng) {
    L.popup({
        minWidth: 200,
        maxWidth: 300,
        className: 'custom-popup'
    })
    .setLatLng(latlng)
    .setContent(content)
    .openOn(map);
}

// ==================== Attribute Table Functions ====================
function populateAttributeTable(properties) {
    const tableBody = document.getElementById('attributeTableBody');
    const tablePanel = document.getElementById('attributeTablePanel');

    // Show the table panel
    tablePanel.style.display = 'block';

    // Clear existing rows
    tableBody.innerHTML = '';

    const format = (value, decimalPlaces = 2) => {
        if (value === undefined || value === null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
    };

    const formatInt = (value) => {
        if (value === undefined || value === null || value === '') return '-';
        const num = parseInt(value, 10);
        if (isNaN(num)) return '-';
        return num.toLocaleString('pt-BR');
    };

    for (const [key, value] of Object.entries(properties)) {
        if (key === 'geometry') continue; // Skip geometry
        if ((key || '').trim() === 'TOTAL DE MORADIAS TEMPORÁRIAS E IMPROVISADAS POR SETOR - MUNICÍPIO DE TANGUÁ - RJ') continue;

        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        const valueCell = document.createElement('td');

        // Use friendly label or key itself
        labelCell.textContent = attributeLabels[key] || key;

        // Format value
        let formattedValue = '-';
        if (['v0001', 'v0002', 'v0003', 'v0004'].includes(key)) {
            formattedValue = formatInt(value);
        } else if (key === 'AREA_KM2') {
            formattedValue = format(value, 2);
        } else if (key === 'v0005') {
            formattedValue = format(value, 1);
        } else if (key === 'v0006') {
            formattedValue = format(value, 4);
        } else if (key === 'v0007') {
            formattedValue = format(value, 2);
        } else if (!(value === null || value === undefined || value === '')) {
            formattedValue = value;
        }

        valueCell.textContent = formattedValue;

        row.appendChild(labelCell);
        row.appendChild(valueCell);
        tableBody.appendChild(row);
    }

    // Scroll to top of table
    document.getElementById('attributeTableContainer').scrollTop = 0;
}

// ==================== Event Listeners ====================
function setupEventListeners() {
    // Basemap selection
    document.querySelectorAll('.basemap-option').forEach(option => {
        option.addEventListener('click', () => {
            const basemap = option.dataset.basemap;
            addBasemap(basemap);
        });
    });

    // Layer toggles
    document.querySelectorAll('.layer-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const layerName = e.target.id.replace('layer-', '');

            if (e.target.checked) {
                showLoading();
                await loadLayer(layerName);
                if (dataLayers[layerName]) {
                    dataLayers[layerName].addTo(map);
                }
                hideLoading();

                // Show attribute selector for census sectors
                if (layerName === 'setores') {
                    const attrSel = document.getElementById('attributeSelector');
                    if (attrSel) attrSel.style.display = 'block';
                    const thematicPanel = document.getElementById('thematicMappingPanel');
                    if (thematicPanel) thematicPanel.style.display = 'block';
                    updateThematicUI();
                }
            } else {
                if (dataLayers[layerName]) {
                    dataLayers[layerName].removeFrom(map);
                }

                // Hide attribute selector for census sectors
                if (layerName === 'setores') {
                    const attrSel = document.getElementById('attributeSelector');
                    if (attrSel) attrSel.style.display = 'none';
                    const thematicPanel = document.getElementById('thematicMappingPanel');
                    if (thematicPanel) thematicPanel.style.display = 'none';
                    
                    // Reset thematic map if active
                    if (currentThematicAttribute) {
                        resetThematicMap();
                    }
                    updateThematicUI();
                }
            }
        });
    });

    // Attribute Selection for Table
    document.querySelectorAll('#attributeSelector input[type="checkbox"]').forEach(cb => {
        const key = cb.value;
        cb.checked = selectedAttributes.has(key);
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedAttributes.add(key);
            } else {
                selectedAttributes.delete(key);
            }
        });
    });

    // Thematic attribute select and buttons
    const attributeSelect = document.getElementById('thematicAttributeSelect');
    const applyBtn = document.getElementById('applyThematicBtn');
    const resetBtn = document.getElementById('resetThematicBtn');
    if (attributeSelect) {
        attributeSelect.addEventListener('change', (e) => {
            updateThematicUI();
        });
    }
    if (applyBtn && attributeSelect) {
        applyBtn.addEventListener('click', () => {
            const attr = attributeSelect.value;
            if (!attr) return;
            updateThematicMap(attr);
            updateThematicUI();
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetThematicMap();
            updateThematicUI();
        });
    }

    // Close Attribute Table
    document.getElementById('closeTableBtn').addEventListener('click', () => {
        document.getElementById('attributeTablePanel').style.display = 'none';
    });

    // Map controls
    document.getElementById('zoomInBtn')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => map.zoomOut());
    document.getElementById('homeBtn')?.addEventListener('click', () => map.setView(CONFIG.center, CONFIG.zoom));

    // Info modal
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.getElementById('closeModal');
    infoBtn?.addEventListener('click', () => infoModal?.classList.add('active'));
    closeModal?.addEventListener('click', () => infoModal?.classList.remove('active'));
    infoModal?.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            infoModal?.classList.remove('active');
            const tablePanel = document.getElementById('attributeTablePanel');
            if (tablePanel && tablePanel.style.display === 'block') tablePanel.style.display = 'none';
        }
    });
}

// ==================== Thematic Mapping ====================
function updateThematicUI() {
    const applyBtn = document.getElementById('applyThematicBtn');
    const resetBtn = document.getElementById('resetThematicBtn');
    const attributeSelect = document.getElementById('thematicAttributeSelect');
    const setoresActive = document.getElementById('layer-setores')?.checked;

    if (applyBtn) {
        applyBtn.disabled = !(setoresActive && attributeSelect && attributeSelect.value);
    }
    if (resetBtn) {
        resetBtn.style.display = currentThematicAttribute ? 'inline-flex' : 'none';
    }
}

function updateThematicMap(attribute) {
    if (!dataLayers['setores']) return;

    currentThematicAttribute = attribute;
    const layer = dataLayers['setores'];
    const values = [];

    // Collect all values
    layer.eachLayer(l => {
        const val = l.feature.properties[attribute];
        if (val !== undefined && val !== null && val !== '') {
            values.push(parseFloat(val));
        }
    });

    if (values.length === 0) return;

    // Calculate Jenks Natural Breaks (using simple quintiles for now as substitute)
    values.sort((a, b) => a - b);
    const minVal = values[0];
    const maxVal = values[values.length - 1];
    
    // Create up to 5 classes
    thematicBreaks = [];
    const numClasses = Math.min(5, values.length); // Handle cases with fewer than 5 values
    
    if (numClasses > 0) {
        for (let i = 1; i <= numClasses; i++) {
            const index = Math.floor(values.length * (i / numClasses)) - 1;
            if (index >= 0) {
                thematicBreaks.push(values[index]);
            }
        }
    }

    // Define colors (Yellow to Red)
    thematicColors = [
        '#ffffb2',
        '#fecc5c',
        '#fd8d3c',
        '#f03b20',
        '#800080' // Roxo para os valores mais altos
    ];
    
    // Adjust colors array if fewer classes
    if (numClasses < 5) {
        thematicColors = thematicColors.slice(0, numClasses);
    }

    // Update legend
    updateLegend(attribute, thematicBreaks, thematicColors, minVal);
    document.getElementById('legendPanel').style.display = 'block';

    // Update layer style
    layer.eachLayer(l => {
        const val = l.feature && l.feature.properties ? l.feature.properties[attribute] : undefined;
        const color = getColorForValue(val, thematicBreaks, thematicColors);
        l.setStyle({
            fillColor: color,
            fillOpacity: 0.8,
            weight: 1,
            color: '#000000'
        });
    });
}

function resetThematicMap() {
    currentThematicAttribute = null;
    const legendPanel = document.getElementById('legendPanel');
    if (legendPanel) {
        legendPanel.style.display = 'none';
    }
    const legendContent = document.getElementById('legendContent');
    if (legendContent) {
        legendContent.innerHTML = '<p class="legend-placeholder">Selecione um atributo temático para ver a legenda</p>';
    }
    
    if (dataLayers['setores']) {
        const config = CONFIG.layers['setores'];
        dataLayers['setores'].eachLayer(layer => {
            layer.setStyle(getFeatureStyle(layer.feature, config.color));
        });
    }
}

function getColorForValue(value, breaks, colors) {
    if (value === undefined || value === null || value === '') return '#cccccc';
    
    value = parseFloat(value);
    
    for (let i = 0; i < breaks.length; i++) {
        if (value <= breaks[i]) {
            return colors[i];
        }
    }
    return colors[colors.length - 1];
}

function updateLegend(attribute, breaks, colors, minVal) {
    const legendContent = document.getElementById('legendContent');
    if (!legendContent) return;

    let html = `<div class="legend-title">${getAttributeLabel(attribute)}</div>`;
    html += '<div class="legend-classes">';
    
    let previousBreak = minVal;
    for (let i = 0; i < breaks.length; i++) {
        const color = colors[i];
        const value = breaks[i];
        let label;
        if (i === 0) {
            label = (minVal === value) ? `${formatNumber(value)}` : `${formatNumber(minVal)} - ${formatNumber(value)}`;
        } else {
            label = `${formatNumber(previousBreak)} - ${formatNumber(value)}`;
        }
        html += `
            <div class="legend-class-item">
                <div class="legend-color-box" style="background-color: ${color}"></div>
                <span class="legend-label">${label}</span>
            </div>
        `;
        previousBreak = value;
    }
    html += '</div>';
    legendContent.innerHTML = html;
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function getAttributeLabel(key) {
    return attributeLabels[key] || key;
}

// ==================== UI Helper Functions ====================
function showLoading() {
    loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

function hideLoading() {
    loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}



// Start application
document.addEventListener('DOMContentLoaded', initMap);
