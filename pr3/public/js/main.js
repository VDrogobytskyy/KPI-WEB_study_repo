document.addEventListener('DOMContentLoaded', () => {
    const plantForm = document.getElementById('plantForm');
    const formResponse = document.getElementById('formResponse');
    const plantsTableBody = document.getElementById('plantsTableBody');

    async function loadPlants() {
        try {
            const response = await fetch('/api/plants');
            const plants = await response.json();
            
            plantsTableBody.innerHTML = '';

            plants.reverse().forEach(plant => {
                const row = `
                    <tr>
                        <td class="fw-bold">${plant.company}</td>
                        <td>${plant.edrpou}</td>
                        <td><span class="badge bg-primary">${plant.type}</span></td>
                        <td>${plant.power} МВт</td>
                        <td>${plant.license}</td>
                        <td class="text-muted small">${plant.date || '—'}</td>
                    </tr>
                `;
                plantsTableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (error) {
            console.error('Помилка завантаження:', error);
        }
    }

    if (plantForm) {
        plantForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(plantForm).entries());

            try {
                const response = await fetch('/api/plants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formResponse.textContent = result.message;
                    formResponse.className = 'mt-3 text-center fw-bold text-success';
                    plantForm.reset();
                    loadPlants();
                } else {
                    formResponse.textContent = result.message;
                    formResponse.className = 'mt-3 text-center fw-bold text-danger';
                }
            } catch (error) {
                formResponse.textContent = 'Помилка сервера';
                formResponse.className = 'mt-3 text-center fw-bold text-danger';
            }
        });
    }

    loadPlants();
});