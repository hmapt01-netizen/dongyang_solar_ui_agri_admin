/* ==========================================================================
   LASEE AI Agrivoltaic PV Compliance & Admin System Charting Engine
   ========================================================================== */

const AgriCharts = {
  instances: {},

  initDashboardCharts: function() {
    this.renderActivityTrendChart();
    this.renderComplianceDistChart();
  },

  renderActivityTrendChart: function() {
    const ctx = document.getElementById('activityTrendChart');
    if (!ctx) return;

    if (this.instances.activityTrend) {
      this.instances.activityTrend.destroy();
    }

    this.instances.activityTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['03.01', '03.05', '03.10', '03.15', '03.20', '03.25', '03.30'],
        datasets: [
          {
            label: '농기계 탐지',
            data: [1, 2, 0, 1, 3, 0, 1],
            borderColor: '#3d5a47',
            backgroundColor: 'rgba(61, 90, 71, 0.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5
          },
          {
            label: '작업자 탐지',
            data: [2, 4, 1, 3, 5, 2, 1],
            borderColor: '#d06245',
            backgroundColor: 'rgba(208, 98, 69, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { weight: 'bold' } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  },

  renderComplianceDistChart: function() {
    const ctx = document.getElementById('complianceDistChart');
    if (!ctx) return;

    if (this.instances.complianceDist) {
      this.instances.complianceDist.destroy();
    }

    this.instances.complianceDist = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['정상 이행 (401소)', '관찰 필요 (28소)', '현장점검 (18소)', '시정 검토 (5소)'],
        datasets: [{
          data: [401, 28, 18, 5],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { weight: 'bold' } } }
        },
        cutout: '70%'
      }
    });
  }
};
