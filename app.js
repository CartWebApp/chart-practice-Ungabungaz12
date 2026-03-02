// change this to reference the dataset you chose to work with.
import { gameSales as chartData } from "./data/gameSales.js";

// --- DOM helpers ---
const yearSelect = document.getElementById("yearSelect");
const genreSelect = document.getElementById("genreSelect");
const metricSelect = document.getElementById("metricSelect");
const chartTypeSelect = document.getElementById("chartType");
const renderBtn = document.getElementById("renderBtn");
const dataPreview = document.getElementById("dataPreview");
const canvas = document.getElementById("chartCanvas");

let currentChart = null;

// --- Populate dropdowns from data ---
const years = [...new Set(chartData.map(r => r.year))];
const genres = [...new Set(chartData.map(r => r.genre))];

years.forEach(m => yearSelect.add(new Option(m, m)));
genres.forEach(h => genreSelect.add(new Option(h, h)));

yearSelect.value = years[0];
genreSelect.value = genres[0];

// Preview first 6 rows
dataPreview.textContent = JSON.stringify(chartData.slice(0, 6), null, 2);

// --- Main render ---
renderBtn.addEventListener("click", () => {
  const chartType = chartTypeSelect.value;
  const year = yearSelect.value;
  const genre = genreSelect.value;
  const metric = metricSelect.value;

  // Destroy old chart if it exists (common Chart.js gotcha)
  if (currentChart) currentChart.destroy();

  // Build chart config based on type
  const config = buildConfig(chartType, { year, genre, metric });

  currentChart = new Chart(canvas, config);
});

// --- Students: you’ll edit / extend these functions ---
function buildConfig(type, { year, genre, metric }) {
  if (type === "bar") return barBygenre(year, metric);
  if (type === "line") return lineOverTime(genre, ["unitsM"]);
  if (type === "scatter") return scatterTripsVsTemp(genre);
  if (type === "doughnut") return doughnutMemberVsCasual(year, genre);
  if (type === "radar") return radarCompareNeighborgenres(year);
  return barBygenre(year, metric);
}


function barBygenre(year, metric) {
  
  const yearsFilter = chartData.filter(r => r.year === Number(year));
  const rows = yearsFilter.filter(r => r.genre === genreSelect.value);
  const platforms = [...new Set(chartData.map(r => r.platform))];
  const labels = platforms;

  const values = platforms.map(p => {
    const row = rows.find(r => r.platform === p);
    return row ? row[metric] : 0;
  });
  console.log("bar config", { labels, values });

  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${metric} in ${year}`,
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Sales by Platform (${year})` }
      },
      scales: {
        y: { title: { display: true, text: metric } },
        x: { title: { display: true, text: "Platform" } }
      }
    }
  };
  
}


function lineOverTime(genre, metrics) {
  const rows = chartData.filter(r => r.genre === genre);
  const years = [...new Set(chartData.map(r => r.year))].sort();
  const labels = years;
  const datasets = metrics.map(metric => ({
    label: metric,
    data: years.map(year => {
      const yearRows = rows.filter(r => r.year === year);
      return yearRows.reduce((sum, r) => sum + r[metric], 0);
    })
  }));


  return {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Sales over years: ${genre}` }
      },
      scales: {
        y: { title: { display: true, text: "Value" } },
        x: { title: { display: true, text: "year" } }
      }
    }
  };
}

// SCATTER — relationship between temperature and trips
function scatterTripsVsTemp(genre) {
  const rows = chartData.filter(r => r.genre === genre);

  const points = rows.map(r => ({ x: r.tempC, y: r.trips }));

  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Trips vs Temp (${genre})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Does temperature affect trips? (${genre})` }
      },
      scales: {
        x: { title: { display: true, text: "Temperature (C)" } },
        y: { title: { display: true, text: "Trips" } }
      }
    }
  };
}


function doughnutMemberVsCasual(year, genre) {
  const row = chartData.find(r => r.year === year && r.genre === genre);

  const member = Math.round(row.memberShare * 100);
  const casual = 100 - member;

  return {
    type: "doughnut",
    data: {
      labels: ["Members (%)", "Casual (%)"],
      datasets: [{ label: "Rider mix", data: [member, casual] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Rider mix: ${genre} (${year})` }
      }
    }
  };
}


function radarCompareNeighborgenres(year) {
  const rows = chartData.filter(r => r.year === year);

  const metrics = ["trips", "revenueUSD", "avgDurationMin", "incidents"];
  const labels = metrics;

  const datasets = rows.map(r => ({
    label: r.genre,
    data: metrics.map(m => r[m])
  }));

  return {
    type: "radar",
    data: { labels, datasets },
    options: {
      plugins: {
        title: { display: true, text: `Multi-metric comparison (${year})` }
      }
    }
  };
}