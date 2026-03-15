const gesParams = [
    { id: 'water-level', min: 100, max: 120, normal: [105.0, 118.0] },
    { id: 'water-spending', min: 50, max: 200, normal: [80, 180] },
    { id: 'turbin-spining', min: 100, max: 150, normal: [110, 140] },
    { id: 'made-power', min: 0, max: 50, normal: [10, 45] },
    { id: 'stopers-position', values: ['Закрито', '25%', '50%', '75%', 'Відкрито'] },
    { id: 'bearings-condition', values: ['Норма', 'Норма', 'Загроза перегріву', 'Норма'] },
    { id: 'vibration-condition', values: ['Низька', 'Оптимальна', 'Підвищена'] }
];

let autoUpdateInterval = null;

function getRandomValue(min, max, decimals = 1) {
    return (Math.random() * (max - min) + min).toFixed(decimals);
}

function getStatusClass(value, param) {
    const v = parseFloat(value);
    if (v >= param.normal[0] && v <= param.normal[1]) return 'text-success';
    if (v >= param.min && v <= param.max) return 'text-warning';
    return 'text-danger';
}

function updateMonitoring() {
    gesParams.forEach(param => {
        const element = document.getElementById(param.id);
        if (!element) return;

        let newValue;
        if (param.values) {
            newValue = param.values[Math.floor(Math.random() * param.values.length)];
            element.textContent = newValue;
            element.className = 'display-6 fw-bold text-primary'; 
        } else {
            newValue = getRandomValue(param.min, param.max, param.id === 'made-power' ? 1 : 2);
            element.textContent = newValue;
            
            element.className = `display-6 fw-bold ${getStatusClass(newValue, param)}`;
        }
    });
    console.log(`Дані оновлено: ${new Date().toLocaleTimeString('uk-UA')}`);
}

function toggleAutoUpdate() {
    const btn = document.getElementById('autoUpdateBtn');
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        if (btn) btn.textContent = 'Увімкнути автооновлення';
    } else {
        autoUpdateInterval = setInterval(updateMonitoring, 1500); 
        if (btn) btn.textContent = 'Зупинити автооновлення';
    }
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('refreshBtn').addEventListener('click', updateMonitoring);
    document.getElementById('autoUpdateBtn').addEventListener('click', toggleAutoUpdate);

    updateMonitoring();
});