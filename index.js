let bloodPressureChart;

function activateSidebarItem(clickedItem) {
  const sidebarItems = document.querySelectorAll(".sidebaritem");
  sidebarItems.forEach((item) => item.classList.remove("active"));
  clickedItem.classList.add("active");
}
function populateDiagnosticList(diagnosticList) {
  const diagnosticListElement = document.getElementById("diagnostic-list");
  diagnosticListElement.innerHTML = "";

  diagnosticList.forEach((diagnostic) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${diagnostic.name} - ${diagnostic.description} (${diagnostic.status})`;
    diagnosticListElement.appendChild(listItem);
  });
}
function populateLabResults(labResults) {
  const labResultsListElement = document.getElementById("lab-results-list");
  labResultsListElement.innerHTML = "";

  labResults.forEach((result) => {
    const listItem = document.createElement("li");
    listItem.textContent = result;
    labResultsListElement.appendChild(listItem);
  });
}

function createChart() {
  const bloodPressureCtx = document
    .getElementById("bloodPressureChart")
    .getContext("2d");

  bloodPressureChart = new Chart(bloodPressureCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Systolic",
          data: [],
          borderColor: "#E66FD2",
          backgroundColor: "rgba(230, 111, 210, 0.2)",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Diastolic",
          data: [],
          borderColor: "#8C6FE6",
          backgroundColor: "rgba(140, 111, 230, 0.2)",
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            font: {
              size: 14,
              family: "Sans-serif",
              style: "normal",
              color: "#333",
            },
            usePointStyle: true,
            boxWidth: 10,
            padding: 20,
          },
          onClick: (e, legendItem) => {
            const index = legendItem.datasetIndex;
            const ci = e.chart;
            const alreadyHidden =
              ci.getDatasetMeta(index).hidden === null
                ? false
                : ci.getDatasetMeta(index).hidden;

            ci.data.datasets.forEach((e, i) => {
              const meta = ci.getDatasetMeta(i);

              if (i !== index) {
                if (!alreadyHidden) {
                  meta.hidden = meta.hidden === null ? !meta.hidden : null;
                } else if (meta.hidden === true) {
                  meta.hidden = null;
                }
              } else if (i === index) {
                meta.hidden = null;
              }
            });

            ci.update();
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
              family: "sans-serif",
              style: "normal",
              color: "#666",
            },
            callback: function (value, index, values) {
              return bloodPressureChart.data.labels[index];
            },
          },
        },
        y: {
          min: 60,
          max: 180,
          ticks: {
            stepSize: 20,
            callback: function (value) {
              return value;
            },
          },
        },
      },
    },
  });
}

function updateChart(patient) {
  const startDate = new Date("2023-09-01");
  const endDate = new Date("2024-03-31");

  const filteredHistory = patient.diagnosis_history
    .filter((entry) => {
      const entryDate = new Date(`${entry.year}-${entry.month}-01`);
      return entryDate >= startDate && entryDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(`${a.year}-${a.month}-01`) -
        new Date(`${b.year}-${b.month}-01`)
    );

  const labels = filteredHistory.map((entry) => {
    const date = new Date(`${entry.year}-${entry.month}-01`);
    return date
      .toLocaleString("default", { month: "short", year: "numeric" })
      .replace(" ", ", ");
  });

  const systolicData = filteredHistory.map(
    (entry) => entry.blood_pressure.systolic.value
  );
  const diastolicData = filteredHistory.map(
    (entry) => entry.blood_pressure.diastolic.value
  );

  bloodPressureChart.data.labels = labels;
  bloodPressureChart.data.datasets[0].data = systolicData;
  bloodPressureChart.data.datasets[1].data = diastolicData;
  bloodPressureChart.update();
}

function displayPatientDetails(patient) {
  document.getElementById("profile-picture").src = patient.profile_picture;
  document.getElementById("patient-name").textContent = patient.name;
  document.getElementById("date-of-birth").textContent = patient.date_of_birth;
  document.getElementById("gender").textContent = patient.gender;
  document.getElementById("phone-number").textContent = patient.phone_number;
  document.getElementById("emergency-contact").textContent =
    patient.emergency_contact;
  document.getElementById("insurance-type").textContent =
    patient.insurance_type;

  const diagnosis = patient.diagnosis_history[0];
  if (diagnosis) {
    document.querySelector(
      ".diagnosis-card-1 .dash-container p:nth-child(2)"
    ).textContent = diagnosis.respiratory_rate.value + " bpm";
    document.querySelector(
      ".diagnosis-card-1 .dash-container p:nth-child(3)"
    ).textContent = diagnosis.respiratory_rate.levels;

    document.querySelector(
      ".diagnosis-card-2 .dash-container p:nth-child(2)"
    ).textContent = diagnosis.temperature.value + " °F";
    document.querySelector(
      ".diagnosis-card-2 .dash-container p:nth-child(3)"
    ).textContent = diagnosis.temperature.levels;

    document.querySelector(
      ".diagnosis-card-3 .dash-container p:nth-child(2)"
    ).textContent = diagnosis.heart_rate.value + " bpm";
    document.querySelector(
      ".diagnosis-card-3 .dash-container p:nth-child(3)"
    ).textContent = diagnosis.heart_rate.levels;
  } else {
    console.error("No diagnosis history available");
  }

  populateDiagnosticList(patient.diagnostic_list);
  populateLabResults(patient.lab_results);

  updateChart(patient);
}

document.addEventListener("DOMContentLoaded", () => {
  const myHeaders = new Headers();

  const encodedCredentials = btoa(BASIC_AUTH_CREDENTIALS);
  myHeaders.append("Authorization", "Basic " + encodedCredentials);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  fetch(
    "https://fedskillstest.coalitiontechnologies.workers.dev",
    requestOptions
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);

      const sidebar = document.querySelector(".sidebar");
      if (!sidebar) {
        console.error("Sidebar element not found");
        return;
      }

      const scrollableContainer = document.createElement("div");
      scrollableContainer.className = "scrollable-container";

      createChart();

      if (data.length > 0) {
        displayPatientDetails(data[0]);
      }

      data.forEach((patient) => {
        const sidebarItem = document.createElement("div");
        sidebarItem.className = "sidebaritem";

        const img = document.createElement("img");
        img.src = patient.profile_picture;
        img.alt = "User";

        const textContainer = document.createElement("div");
        textContainer.className = "text-container";

        const name = document.createElement("p");
        name.className = "name";
        name.textContent = patient.name;

        const info = document.createElement("div");
        info.className = "info";

        const gender = document.createElement("p");
        gender.className = "gender";
        gender.textContent = patient.gender + ",";

        const age = document.createElement("p");
        age.className = "age";
        age.textContent = patient.age;

        info.appendChild(gender);
        info.appendChild(age);

        textContainer.appendChild(name);
        textContainer.appendChild(info);

        sidebarItem.appendChild(img);
        sidebarItem.appendChild(textContainer);

        sidebarItem.addEventListener("click", () => {
          displayPatientDetails(patient);
          activateSidebarItem(sidebarItem);
        });

        scrollableContainer.appendChild(sidebarItem);
      });

      sidebar.appendChild(scrollableContainer);
    })
    .catch((error) => console.error("Error fetching patient data:", error));
});
