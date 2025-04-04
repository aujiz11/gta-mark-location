let mapWrapper = document.getElementById('mapWrapper');
let mapImage = document.getElementById('mapImage');
let locationSelect = document.getElementById('locationSelect');
let locationInfo = document.getElementById('locationInfo');
let markers = document.getElementById('markers');
let searchInput = document.getElementById('searchInput');
let mapContainer = document.getElementById('mapContainer');

let locations = [];
let currentScale = 1;
let dragStart = { x: 0, y: 0 };
let mapPosition = { x: 0, y: 0 };
let isDragging = false;
let lastTouchDistance = 0;

// Map dimensions and boundaries
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 1200;
const GTA_MIN_X = -3000;
const GTA_MAX_X = 3000;
const GTA_MIN_Y = -3000;
const GTA_MAX_Y = 3000;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_FACTOR = 1.2;

function convertToMapCoords(x, y) {
    return {
        x: ((x - GTA_MIN_X) / (GTA_MAX_X - GTA_MIN_X)) * MAP_WIDTH,
        y: (1 - ((y - GTA_MIN_Y) / (GTA_MAX_Y - GTA_MIN_Y))) * MAP_HEIGHT
    };
}

function initMap() {
    fetch('assets/json/location.json')
        .then(response => response.json())
        .then(data => {
            locations = data.locations;
            populateLocationSelect();
            setupEventListeners();
        })
        .catch(error => {
            console.error('Error loading locations:', error);
            locationInfo.textContent = 'Error loading locations data.';
        });
}

function populateLocationSelect() {
    const locationsWithIndex = locations.map((location, index) => ({
        location,
        originalIndex: index
    }));
    
    const sortedLocations = [...locationsWithIndex].sort((a, b) => 
        a.location.name.localeCompare(b.location.name)
    );
    
    const uniqueNames = new Map();
    
    sortedLocations.forEach((item) => {
        const location = item.location;
        if (!uniqueNames.has(location.name)) {
            uniqueNames.set(location.name, true);
            const option = document.createElement('option');
            option.value = item.originalIndex;
            option.textContent = location.name;
            locationSelect.appendChild(option);
        }
    });
}

/*
* Show location information
*/
function showLocation(location) {
    clearMarkers();
    
    const bounds = location.bounds;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const mapCoords = convertToMapCoords(centerX, centerY);

    const marker = createMarker(mapCoords.x, mapCoords.y, location.name);
    marker.classList.add('active');
    
    locationInfo.innerHTML = `
        <h3>${location.name}</h3>
        <p>Center: X: ${centerX.toFixed(2)}, Y: ${centerY.toFixed(2)}, Z: ${centerZ.toFixed(2)}</p>
        <p>Bounds:</p>
        <p>X: ${bounds.minX.toFixed(2)} to ${bounds.maxX.toFixed(2)}</p>
        <p>Y: ${bounds.minY.toFixed(2)} to ${bounds.maxY.toFixed(2)}</p>
        <p>Z: ${bounds.minZ.toFixed(2)} to ${bounds.maxZ.toFixed(2)}</p>
    `;
     
    zoomToMarkedLocation(mapCoords.x, mapCoords.y);
}

function createMarker(x, y, name, type = 'default') {
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.dataset.type = type;
    
    const label = document.createElement('div');
    label.className = 'marker-label';
    label.textContent = name;
    
    marker.appendChild(label);
    markers.appendChild(marker);
    marker.addEventListener('click', function() {
        const activeMarkers = document.querySelectorAll('.marker.active');
        activeMarkers.forEach(m => m.classList.remove('active'));
        marker.classList.add('active');
        if (name !== "Unknown Location") {
            const locationIndex = [...locationSelect.options].findIndex(option => 
                option.textContent === name
            );
            if (locationIndex !== -1) {
                locationSelect.selectedIndex = locationIndex;
                showLocation(locations[locationSelect.value]);
            }
        }
    });
    
    marker.addEventListener('mouseenter', function() {
        label.style.opacity = '1';
    });
    
    marker.addEventListener('mouseleave', function() {
        if (!marker.classList.contains('active')) {
            label.style.opacity = '0';
        }
    });
    
    return marker;
}

function clearMarkers() {
    while (markers.firstChild) {
        markers.removeChild(markers.firstChild);
    }
}

/*
* Center the map on a specific point (x, y)
*/
function centerMapOnPoint(x, y) {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;

    //currentScale = 1.5;
    
    mapPosition.x = Math.round(containerWidth / 2 - x * currentScale);
    mapPosition.y = Math.round(containerHeight / 2 - y * currentScale);
    
    requestAnimationFrame(() => {
        updateMapTransform();
    });
}

function zoomToMarkedLocation(x, y, zoomLevel = 1.5) {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;

    currentScale = zoomLevel;
    
    mapPosition.x = Math.round(containerWidth / 2 - x * currentScale + currentScale * 180);
    mapPosition.y = Math.round(containerHeight / 2 - y * currentScale + currentScale * 180);
    
    requestAnimationFrame(() => {
        updateMapTransform();
    });
}

function updateMapTransform() {
    mapWrapper.style.transform = `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${currentScale})`;
}

function enforceBoundaries() {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    const mapScaledWidth = MAP_WIDTH * currentScale;
    const mapScaledHeight = MAP_HEIGHT * currentScale;
    
    const minX = -mapScaledWidth + containerWidth * 0.25;
    const maxX = containerWidth * 0.75;
    const minY = -mapScaledHeight + containerHeight * 0.25;
    const maxY = containerHeight * 0.75;
    
    mapPosition.x = Math.min(Math.max(mapPosition.x, minX), maxX);
    mapPosition.y = Math.min(Math.max(mapPosition.y, minY), maxY);
}

function zoomAtPoint(scaleFactor, clientX, clientY) {
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const mapX = (mouseX - mapPosition.x) / currentScale;
    const mapY = (mouseY - mapPosition.y) / currentScale;
    
    const oldScale = currentScale;
    currentScale *= scaleFactor;
    currentScale = Math.min(Math.max(currentScale, MIN_ZOOM), MAX_ZOOM);
    
    const realScaleFactor = currentScale / oldScale;
    mapPosition.x = mouseX - mapX * currentScale;
    mapPosition.y = mouseY - mapY * currentScale;
    
    enforceBoundaries();
    updateMapTransform();
}
function zoomIn() {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    zoomAtPoint(ZOOM_FACTOR, containerWidth / 2, containerHeight / 2);
}

function zoomOut() {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    zoomAtPoint(1 / ZOOM_FACTOR, containerWidth / 2, containerHeight / 2);
}

function resetZoom() {
    currentScale = 1;
    mapPosition.x = 0;
    mapPosition.y = 0;
    updateMapTransform();
}

function filterLocations() {
    const searchTerm = searchInput.value.toLowerCase();
    locationSelect.innerHTML = '';
    
    const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));
    const uniqueNames = new Map();
    
    sortedLocations.forEach((location, index) => {
        if (!uniqueNames.has(location.name) && location.name.toLowerCase().includes(searchTerm)) {
            uniqueNames.set(location.name, true);
            const option = document.createElement('option');
            option.value = index;
            option.textContent = location.name;
            locationSelect.appendChild(option);
        }
    });
}

function startDrag(e) {
    e.preventDefault();
    
    if (e.touches || (e.button === 0)) {
        if (e.touches) {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            } else if (e.touches.length === 1) {
                dragStart.x = e.touches[0].clientX;
                dragStart.y = e.touches[0].clientY;
                isDragging = true;
            }
        } else {
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            isDragging = true;
        }
        
        mapContainer.style.cursor = 'grabbing';
    }
}

function drag(e) {
    e.preventDefault();
    
    if (e.touches) {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            if (lastTouchDistance > 0) {
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                const scaleFactor = currentTouchDistance / lastTouchDistance;
                
                zoomAtPoint(scaleFactor, centerX, centerY);
            }
            
            lastTouchDistance = currentTouchDistance;
            return;
        }
        else if (e.touches.length !== 1) {
            return;
        }
    }
    
    if (!isDragging) return;
    
    let currentX, currentY;
    if (e.touches) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    mapPosition.x += deltaX;
    mapPosition.y += deltaY;
    
    dragStart.x = currentX;
    dragStart.y = currentY;
    
    enforceBoundaries();
    updateMapTransform();
}

function endDrag(e) {
    isDragging = false;
    lastTouchDistance = 0;
    mapContainer.style.cursor = 'grab';
}

function findLocationByCoords(x, y, z) {
    for (const location of locations) {
        const bounds = location.bounds;
        if (
            x >= bounds.minX && x <= bounds.maxX &&
            y >= bounds.minY && y <= bounds.maxY &&
            z >= bounds.minZ && z <= bounds.maxZ
        ) {
            return location;
        }
    }
    return null;
}

function markUserLocation() {
    const xInput = parseFloat(document.getElementById('xCoord').value);
    const yInput = parseFloat(document.getElementById('yCoord').value);
    const zInput = parseFloat(document.getElementById('zCoord').value);
    if (isNaN(xInput) || isNaN(yInput) || isNaN(zInput)) {
        locationInfo.innerHTML = '<p style="color: #f77;">Please enter valid coordinates.</p>';
        return;
    }

    const location = findLocationByCoords(xInput, yInput, zInput);
    clearMarkers();
    const mapCoords = convertToMapCoords(xInput, yInput);
    
    let marker;
    if (location) {
        marker = createMarker(mapCoords.x, mapCoords.y, location.name);
        locationInfo.innerHTML = `
            <h3>${location.name}</h3>
            <p>Coordinates: X: ${xInput.toFixed(2)}, Y: ${yInput.toFixed(2)}, Z: ${zInput.toFixed(2)}</p>
            <p>Bounds:</p>
            <p>X: ${location.bounds.minX.toFixed(2)} to ${location.bounds.maxX.toFixed(2)}</p>
            <p>Y: ${location.bounds.minY.toFixed(2)} to ${location.bounds.maxY.toFixed(2)}</p>
            <p>Z: ${location.bounds.minZ.toFixed(2)} to ${location.bounds.maxZ.toFixed(2)}</p>
        `;
    } else {
        marker = createMarker(mapCoords.x, mapCoords.y, "Unknown Location", "important");
        locationInfo.innerHTML = `
            <h3>Location not found</h3>
            <p>Coordinates: X: ${xInput.toFixed(2)}, Y: ${yInput.toFixed(2)}, Z: ${zInput.toFixed(2)}</p>
            <p>No location contains these coordinates.</p>
        `;
    }
    
    marker.classList.add('active');
    zoomToMarkedLocation(mapCoords.x, mapCoords.y);
}

function handleDoubleClick(e) {
    const scaleFactor = ZOOM_FACTOR;
    zoomAtPoint(scaleFactor, e.clientX, e.clientY);
}

function setupEventListeners() {
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    document.getElementById('resetZoom').addEventListener('click', resetZoom);
    locationSelect.addEventListener('change', function() {
        const selectedIndex = this.value;
        showLocation(locations[selectedIndex]);
    });

    searchInput.addEventListener('input', filterLocations);
    
    mapContainer.addEventListener('mousedown', startDrag, { passive: false });
    window.addEventListener('mousemove', drag, { passive: false });
    window.addEventListener('mouseup', endDrag);

    mapContainer.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);
    
    // Double-click to zoom
    mapContainer.addEventListener('dblclick', handleDoubleClick);
    
    mapContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        const scaleFactor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        zoomAtPoint(scaleFactor, e.clientX, e.clientY);
    }, { passive: false });
    
    document.getElementById('markLocation').addEventListener('click', markUserLocation);
    
    document.getElementById('xCoord').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') markUserLocation();
    });
    document.getElementById('yCoord').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') markUserLocation();
    });
    document.getElementById('zCoord').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') markUserLocation();
    });

    resetZoom();
}

window.addEventListener('DOMContentLoaded', initMap);
