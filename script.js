// Chromagen - Premium Color Palette Generator

// State
let colors = [];
const DEFAULT_PALETTE_SIZE = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generatePalette();
    setupEventListeners();
});

function setupEventListeners() {
    // Main controls
    document.getElementById('generate-btn').addEventListener('click', generatePalette);
    document.getElementById('palette-size').addEventListener('change', () => generatePalette());
    document.getElementById('color-mode').addEventListener('change', () => generatePalette());

    // Export controls
    const exportBtn = document.getElementById('export-btn');
    const exportOptions = document.getElementById('export-options');

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportOptions.classList.toggle('visible');
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportOptions.contains(e.target)) {
            exportOptions.classList.remove('visible');
        }
    });

    // Export format buttons
    document.querySelectorAll('.export-options button').forEach(btn => {
        btn.addEventListener('click', () => {
            exportPalette(btn.dataset.format);
            exportOptions.classList.remove('visible');
        });
    });

    // Keyboard shortcut (Spacebar)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            e.preventDefault(); // Prevent scrolling
            generatePalette();
        }
    });

    // Modal Close
    document.getElementById('close-modal').addEventListener('click', closeShadesModal);
    document.getElementById('shades-modal').addEventListener('click', (e) => {
        if (e.target.id === 'shades-modal') closeShadesModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeShadesModal();
    });
}

// Core Logic
function generatePalette() {
    const mode = document.getElementById('color-mode').value;
    let size = parseInt(document.getElementById('palette-size').value);

    // Validate size
    if (isNaN(size) || size < 1) size = 1;
    if (size > 100) size = 100;

    // Resize colors array if needed, preserving locked colors
    if (colors.length !== size) {
        const newColors = Array(size).fill().map((_, i) => {
            return colors[i] || { hex: getRandomHex(), locked: false };
        });
        colors = newColors;
    }

    // Generate based on mode
    switch (mode) {
        case 'monochromatic': generateMonochromatic(size); break;
        case 'analogous': generateAnalogous(size); break;
        case 'complementary': generateComplementary(size); break;
        case 'triadic': generateTriadic(size); break;
        default: generateRandom(size);
    }

    renderPalette();
}

// Generation Algorithms
function generateRandom(size) {
    colors = colors.map(c => c.locked ? c : { hex: getRandomHex(), locked: false });
}

function generateMonochromatic(size) {
    const base = getBaseColor();
    const baseHSL = hexToHSL(base.hex);

    colors = colors.map((c, i) => {
        if (c.locked) return c;
        const l = 20 + (i * 60 / size); // Spread lightness
        return { hex: hslToHex(baseHSL.h, baseHSL.s, l), locked: false };
    });
}

function generateAnalogous(size) {
    const base = getBaseColor();
    const baseHSL = hexToHSL(base.hex);

    colors = colors.map((c, i) => {
        if (c.locked) return c;
        const h = (baseHSL.h + (i * 30)) % 360;
        return { hex: hslToHex(h, baseHSL.s, baseHSL.l), locked: false };
    });
}

function generateComplementary(size) {
    const base = getBaseColor();
    const baseHSL = hexToHSL(base.hex);

    colors = colors.map((c, i) => {
        if (c.locked) return c;
        const h = i < size / 2 ? baseHSL.h : (baseHSL.h + 180) % 360;
        const l = 40 + Math.random() * 20;
        return { hex: hslToHex(h, baseHSL.s, l), locked: false };
    });
}

function generateTriadic(size) {
    const base = getBaseColor();
    const baseHSL = hexToHSL(base.hex);

    colors = colors.map((c, i) => {
        if (c.locked) return c;
        const h = (baseHSL.h + (i * 120)) % 360; // 0, 120, 240
        return { hex: hslToHex(h, baseHSL.s, baseHSL.l), locked: false };
    });
}

function getBaseColor() {
    const locked = colors.find(c => c.locked);
    return locked || { hex: getRandomHex() };
}

// Rendering
function renderPalette() {
    const container = document.getElementById('color-palette');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'color-grid';

    // Adjust grid columns based on count
    if (colors.length > 10) {
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    } else {
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    }

    colors.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        if (colors.length > 20) swatch.classList.add('compact');

        // Calculate contrast color for text/icons
        const textColor = getContrastColor(color.hex);

        // Lock Button
        const lockBtn = document.createElement('div');
        lockBtn.className = 'lock-btn';
        lockBtn.innerHTML = color.locked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>';
        lockBtn.style.color = textColor;
        lockBtn.onclick = (e) => {
            e.stopPropagation();
            toggleLock(index);
        };

        // Color Display
        const display = document.createElement('div');
        display.className = 'color-display';
        display.style.backgroundColor = color.hex;
        display.innerHTML = `<span class="copy-overlay" style="color: ${textColor}">View Shades</span>`;
        display.onclick = () => openShadesModal(color.hex);

        // Info Area
        const info = document.createElement('div');
        info.className = 'color-info';

        const name = document.createElement('div');
        name.className = 'color-name';
        name.textContent = getNearestColorName(color.hex);

        const hex = document.createElement('div');
        hex.className = 'color-hex';
        hex.textContent = color.hex.toUpperCase();

        // Hide RGB if too compact
        if (colors.length <= 20) {
            const rgb = document.createElement('div');
            rgb.className = 'color-rgb';
            const rgbVal = hexToRgb(color.hex);
            rgb.textContent = `${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}`;

            info.appendChild(name);
            info.appendChild(hex);
            info.appendChild(rgb);
        } else {
            info.appendChild(name);
            info.appendChild(hex);
        }

        swatch.appendChild(lockBtn);
        swatch.appendChild(display);
        swatch.appendChild(info);
        grid.appendChild(swatch);
    });

    container.appendChild(grid);
}

function toggleLock(index) {
    colors[index].locked = !colors[index].locked;
    renderPalette();
}

// Utilities
function getRandomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function getContrastColor(hex) {
    const rgb = hexToRgb(hex);
    // YIQ equation for brightness
    const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
}

function exportPalette(format) {
    let text = '';
    switch (format) {
        case 'hex': text = colors.map(c => c.hex).join(', '); break;
        case 'rgb': text = colors.map(c => {
            const rgb = hexToRgb(c.hex);
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }).join(', '); break;
        case 'css': text = colors.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n'); break;
    }
    copyToClipboard(text);
    alert('Palette copied to clipboard!');
}

// Color Conversions
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToHSL(hex) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Shades & Tints Logic
function openShadesModal(hex) {
    const modal = document.getElementById('shades-modal');
    const display = document.getElementById('modal-color-display');
    const hexText = document.getElementById('modal-color-hex');
    const tintsGrid = document.getElementById('tints-grid');
    const shadesGrid = document.getElementById('shades-grid');

    display.style.backgroundColor = hex;
    display.style.color = getContrastColor(hex);
    hexText.textContent = hex.toUpperCase();

    // Generate and render variations
    renderVariations(tintsGrid, generateTints(hex));
    renderVariations(shadesGrid, generateShades(hex));

    modal.classList.add('visible');
}

function closeShadesModal() {
    document.getElementById('shades-modal').classList.remove('visible');
}

function generateTints(hex) {
    const tints = [];
    const { r, g, b } = hexToRgb(hex);

    for (let i = 1; i <= 10; i++) {
        const factor = i / 11;
        const newR = Math.round(r + (255 - r) * factor);
        const newG = Math.round(g + (255 - g) * factor);
        const newB = Math.round(b + (255 - b) * factor);
        tints.push(rgbToHex(newR, newG, newB));
    }
    return tints;
}

function generateShades(hex) {
    const shades = [];
    const { r, g, b } = hexToRgb(hex);

    for (let i = 1; i <= 10; i++) {
        const factor = 1 - (i / 11);
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        shades.push(rgbToHex(newR, newG, newB));
    }
    return shades;
}

function renderVariations(container, colors) {
    container.innerHTML = '';
    colors.forEach(hex => {
        const chip = document.createElement('div');
        chip.className = 'variation-chip';
        chip.style.backgroundColor = hex;
        chip.onclick = () => {
            copyToClipboard(hex);
            // Visual feedback
            const originalTransform = chip.style.transform;
            chip.style.transform = 'scale(0.9)';
            setTimeout(() => chip.style.transform = originalTransform, 100);
        };
        container.appendChild(chip);
    });
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}