/**
 * NiyamAI - Analytics & Drift Charts
 * Step 05: Governance Intelligence
 */

let violationChartInstance = null;
let driftChartInstance = null;
let channelChartInstance = null;

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') {
    setTimeout(initAnalyticsCharts, 200);
    return;
  }
  const analytics = NiyamMockData.analytics;

  // 1. Friction & Violation Breakdown Chart (Doughnut)
  const violationCtx = document.getElementById('violationDoughnutChart');
  if (violationCtx) {
    if (violationChartInstance) violationChartInstance.destroy();

    violationChartInstance = new Chart(violationCtx, {
      type: 'doughnut',
      data: {
        labels: analytics.categoryBreakdown.labels,
        datasets: [{
          data: analytics.categoryBreakdown.percentages,
          backgroundColor: [
            '#4E1227', // Rich wine
            '#8C264A', // Rose plum
            '#8FA89B', // Sage green
            '#D9A58F', // Muted peach
            '#788FA3'  // Slate blue
          ],
          borderWidth: 3,
          borderColor: '#FAF7F5',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: '600'
              },
              color: '#3B0E1C'
            }
          },
          tooltip: {
            backgroundColor: '#330B18',
            titleFont: { family: "'Syne', sans-serif", size: 13 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.raw}% of total flags`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // 2. Monthly Drift & Velocity Trend (Dual Axis Chart)
  const driftCtx = document.getElementById('driftTrendChart');
  if (driftCtx) {
    if (driftChartInstance) driftChartInstance.destroy();

    driftChartInstance = new Chart(driftCtx, {
      type: 'line',
      data: {
        labels: analytics.trendData.labels,
        datasets: [
          {
            label: 'Governance Health Score (%)',
            data: analytics.trendData.complianceScores,
            borderColor: '#4E1227',
            backgroundColor: 'rgba(78, 18, 39, 0.08)',
            borderWidth: 3,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#4E1227',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y'
          },
          {
            label: 'Review Turnaround (Hours)',
            data: analytics.trendData.turnaroundHours,
            borderColor: '#8FA89B',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: [5, 5],
            tension: 0.38,
            pointBackgroundColor: '#8FA89B',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 14,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
                weight: '600'
              },
              color: '#4E1227'
            }
          },
          tooltip: {
            backgroundColor: '#330B18',
            titleFont: { family: "'Syne', sans-serif", size: 13 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 12,
            cornerRadius: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(232, 222, 216, 0.5)' },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
              color: '#6B5760'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 70,
            max: 100,
            grid: { color: 'rgba(232, 222, 216, 0.5)' },
            ticks: {
              callback: val => val + '%',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: '#4E1227'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 50,
            grid: { drawOnChartArea: false },
            ticks: {
              callback: val => val + 'h',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: '#8FA89B'
            }
          }
        }
      }
    });
  }

  // 3. Channel Compliance Bar Chart
  const channelCtx = document.getElementById('channelHealthChart');
  if (channelCtx) {
    if (channelChartInstance) channelChartInstance.destroy();

    channelChartInstance = new Chart(channelCtx, {
      type: 'bar',
      data: {
        labels: analytics.channelDistribution.labels,
        datasets: [{
          label: 'Channel Pass Rate (%)',
          data: analytics.channelDistribution.scores,
          backgroundColor: [
            '#4E1227', // Web
            '#691D37', // PR
            '#8C264A', // IR
            '#8FA89B', // Email
            '#D9A58F', // Social
            '#B07289'  // Ads
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#330B18',
            titleFont: { family: "'Syne', sans-serif", size: 13 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: context => ` Compliance Score: ${context.raw}%`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
              color: '#4E1227'
            }
          },
          y: {
            min: 60,
            max: 100,
            grid: { color: 'rgba(232, 222, 216, 0.4)' },
            ticks: {
              callback: val => val + '%',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: '#6B5760'
            }
          }
        }
      }
    });
  }
}
