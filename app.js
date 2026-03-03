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
const platformSelect = document.getElementById("platformSelect");

let currentChart = null;

// --- Populate dropdowns from data ---


const years = [...new Set(chartData.map(r => r.year))].sort();
const genres = [...new Set(chartData.map(r => r.genre))];
const platforms = [...new Set(chartData.map(r => r.platform))];

years.forEach(m => yearSelect.add(new Option(m, m)));
genres.forEach(h => genreSelect.add(new Option(h, h)));
platforms.forEach(p => platformSelect.add(new Option(p, p)));

yearSelect.value = years[0];
genreSelect.value = genres[0];
platformSelect.value = platforms[0];

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
  if (type === "scatter") return scatterReviewsVsSales(genre);
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
  // Filter by selected platform too
  const genreFilter = chartData.filter(r => r.genre === genre);
  const rows = genreFilter.filter(r => r.platform === platformSelect.value);
  const years = [...new Set(rows.map(r => r.year))].sort();
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


function scatterReviewsVsSales(genre) {
  const yearsFilter = chartData.filter(r => r.year === Number(yearSelect.value));
  const rows = yearsFilter.filter(r => r.genre === genreSelect.value);

  const points = rows.map(r => ({ x: r.reviewScore, y: r.unitsM }));


  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Review scores vs Sales (${genre})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Does review scores affect (${genre}) in (${yearSelect.value})?` }
      },
      scales: {
        x: { title: { display: true, text: "ReviewScore" } },
        y: { title: { display: true, text: "UnitsM" } }
      }
    }
  };
}


function doughnutMemberVsCasual(year, genre) {
  const yearsFilter = chartData.filter(r => r.year === Number(year));
  const genreFilter = yearsFilter.filter(r => r.genre === genre);
  const regions = [...new Set(chartData.map(r => r.region))];

  const NA = row.NA;
  const EU = row.EU;
  const JP = row.JP;
  const ASIA = 100 - NA - EU - JP;

  console.log("doughnut config", { regions, NA, EU, JP, ASIA }); 


  return {
    type: "doughnut",
    data: {
      labels: regions,
      datasets: [{ label: "Region Share", data: [NA, EU, JP, ASIA] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Region Share: ${genre} (${year})` }
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