class BessMonitorApp {
  constructor() {
    this.historyLimit = 16;
    this.history = [];
    this.chart = null;
    this.state = {
      soc: 64,
      power: 120,
      voltage: 728,
      current: 165,
      temperature: 27,
      cycles: 913,
      mode: "Заряд",
      online: true,
    };

    this.elements = {
      socValue: document.getElementById("socValue"),
      socBar: document.getElementById("socBar"),
      powerValue: document.getElementById("powerValue"),
      voltageValue: document.getElementById("voltageValue"),
      currentValue: document.getElementById("currentValue"),
      temperatureValue: document.getElementById("temperatureValue"),
      cyclesValue: document.getElementById("cyclesValue"),
      systemMode: document.getElementById("systemMode"),
      statusDot: document.getElementById("statusDot"),
      temperatureIndicator: document.getElementById("temperatureIndicator"),
      temperatureState: document.getElementById("temperatureState"),
      metricsTable: document.getElementById("metricsTable"),
      lastUpdate: document.getElementById("lastUpdate"),
    };

    this.initChart();
    this.loadInitialData();
    this.startRealtimeUpdates();
  }

  initChart() {
    const ctx = document.getElementById("powerChart");
    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Потужність, кВт",
            data: [],
            borderColor: "#0f5fbf",
            backgroundColor: (context) => {
              const value = context.raw ?? 0;
              return value >= 0 ? "rgba(31, 157, 99, 0.72)" : "rgba(216, 74, 74, 0.72)";
            },
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw} кВт`,
            },
          },
        },
        scales: {
          y: {
            suggestedMin: -300,
            suggestedMax: 300,
            ticks: {
              callback: (value) => `${value} кВт`,
            },
            grid: {
              color: (context) => (context.tick.value === 0 ? "rgba(216, 74, 74, 0.35)" : "rgba(25, 32, 40, 0.08)"),
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  async loadInitialData() {
    const initialHistory = await this.fetchHistory();
    if (initialHistory.length > 0) {
      this.history = initialHistory.slice(-this.historyLimit);
    }

    const initialSnapshot = await this.fetchSnapshot();
    this.applySnapshot(initialSnapshot);
    if (initialSnapshot) {
      this.pushHistoryFromServer(initialSnapshot);
    }
    this.render();
  }

  async fetchJson(pathname, timeoutMs = 1200) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(pathname, {
        signal: controller.signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchSnapshot() {
    try {
      const data = await this.fetchJson("/api/bess");
      return { ...data, online: true };
    } catch {
      return null;
    }
  }

  async fetchHistory() {
    try {
      const data = await this.fetchJson(`/api/bess/history?limit=${this.historyLimit}`);
      const items = Array.isArray(data?.items) ? data.items : [];
      return items
        .filter((item) => item && typeof item.ts === "string" && typeof item.power === "number")
        .map((item) => ({
          time: new Date(item.ts).toLocaleTimeString("uk-UA"),
          power: item.power,
        }));
    } catch {
      return [];
    }
  }

  startRealtimeUpdates() {
    setInterval(() => {
      this.tick();
    }, 2200);
  }

  async tick() {
    const snapshot = await this.fetchSnapshot();
    if (!snapshot) {
      this.applySnapshot({ ...this.state, online: false });
      this.render();
      return;
    }

    this.applySnapshot(snapshot);
    this.pushHistoryFromServer(snapshot);
    this.render();
  }

  applySnapshot(snapshot) {
    this.state = { ...snapshot };
  }

  pushHistoryFromServer(snapshot) {
    const timestamp = snapshot?.ts ? new Date(snapshot.ts).toLocaleTimeString("uk-UA") : new Date().toLocaleTimeString("uk-UA");
    if (typeof snapshot?.power !== "number") return;

    this.history.push({ time: timestamp, power: snapshot.power });
    if (this.history.length > this.historyLimit) this.history.shift();
  }

  render() {
    const { soc, power, voltage, current, temperature, cycles, mode, online } = this.state;

    this.elements.socValue.textContent = `${soc}%`;
    this.elements.socBar.style.width = `${soc}%`;
    this.elements.powerValue.textContent = `${power > 0 ? "+" : ""}${power} кВт`;
    this.elements.voltageValue.textContent = `${voltage} В`;
    this.elements.currentValue.textContent = `${current} А`;
    this.elements.temperatureValue.textContent = `${temperature} °C`;
    this.elements.cyclesValue.textContent = String(cycles);
    this.elements.systemMode.textContent = online ? mode : "Немає зв'язку";
    this.elements.statusDot.style.background = online ? "#1f9d63" : "#d84a4a";
    this.elements.statusDot.style.boxShadow = online
      ? "0 0 0 8px rgba(31, 157, 99, 0.12)"
      : "0 0 0 8px rgba(216, 74, 74, 0.15)";

    const indicatorPosition = ((temperature - 10) / 40) * 100;
    this.elements.temperatureIndicator.style.left = `${Math.max(0, Math.min(100, indicatorPosition))}%`;
    this.elements.temperatureState.textContent = this.getTemperatureText(temperature);
    this.elements.lastUpdate.textContent = `Оновлення: ${new Date().toLocaleTimeString("uk-UA")}`;

    this.renderTable();
    this.renderChart();
  }

  renderTable() {
    const { soc, power, voltage, current, temperature, cycles } = this.state;
    const rows = [
      ["Рівень заряду", `${soc}%`, this.getSocStatus(soc)],
      ["Потужність", `${power > 0 ? "+" : ""}${power} кВт`, this.getPowerStatus(power)],
      ["Напруга батареї", `${voltage} В`, this.getVoltageStatus(voltage)],
      ["Струм", `${current} А`, this.getCurrentStatus(current)],
      ["Температура блоку", `${temperature} °C`, this.getTemperatureStatus(temperature)],
      ["Кількість циклів", `${cycles}`, this.getCyclesStatus(cycles)],
    ];

    this.elements.metricsTable.innerHTML = rows
      .map(
        ([label, value, status]) => `
          <tr>
            <td>${label}</td>
            <td>${value}</td>
            <td><span class="status-badge ${status.className}">${status.label}</span></td>
          </tr>
        `
      )
      .join("");
  }

  renderChart() {
    this.chart.data.labels = this.history.map((item) => item.time);
    this.chart.data.datasets[0].data = this.history.map((item) => item.power);
    this.chart.update();
  }

  getSocStatus(soc) {
    if (soc < 20 || soc > 92) {
      return { label: "Увага", className: "status-warning" };
    }
    return { label: "Норма", className: "status-normal" };
  }

  getPowerStatus(power) {
    if (Math.abs(power) > 220) {
      return { label: "Пікове", className: "status-warning" };
    }
    return { label: power >= 0 ? "Заряд" : "Розряд", className: "status-normal" };
  }

  getVoltageStatus(voltage) {
    if (voltage < 690 || voltage > 780) {
      return { label: "Поза діапазоном", className: "status-warning" };
    }
    return { label: "Стабільно", className: "status-normal" };
  }

  getCurrentStatus(current) {
    if (Math.abs(current) > 320) {
      return { label: "Перевантаження", className: "status-critical" };
    }
    return { label: "Допустимо", className: "status-normal" };
  }

  getTemperatureStatus(temperature) {
    if (temperature >= 40) {
      return { label: "Критично", className: "status-critical" };
    }
    if (temperature >= 34) {
      return { label: "Підігрів", className: "status-warning" };
    }
    return { label: "Норма", className: "status-normal" };
  }

  getCyclesStatus(cycles) {
    if (cycles > 4500) {
      return { label: "Зношення", className: "status-warning" };
    }
    return { label: "Ресурс OK", className: "status-normal" };
  }

  getTemperatureText(temperature) {
    if (temperature >= 40) {
      return "Температура зависока, потрібне негайне охолодження.";
    }
    if (temperature >= 34) {
      return "Температура підвищена, система працює біля верхньої межі.";
    }
    if (temperature <= 20) {
      return "Температура нижча за оптимальну, ефективність може зменшитись.";
    }
    return "Температурний режим стабільний.";
  }

}

document.addEventListener("DOMContentLoaded", () => {
  new BessMonitorApp();
});
