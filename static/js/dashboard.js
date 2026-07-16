/**
 * dashboard.js
 * Contains the extracted countUpAnimation logic for the glassmorphic stats cards.
 */

document.addEventListener("DOMContentLoaded", () => {
    function countUpAnimation(target, duration, el) {
        let start = 0;
        const increment = target / (duration / 16);
        function updateCount() {
            start += increment;
            if (start < target) {
                el.innerText = Math.ceil(start).toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                el.innerText = target.toLocaleString();
            }
        }
        updateCount();
    }

    // Target elements with data-live-stat
    const statsElements = document.querySelectorAll("[data-live-stat]");
    
    statsElements.forEach((el) => {
        const valElem = el.querySelector("p");
        if (valElem) {
            const targetStr = valElem.textContent.trim().replace(/,/g, '');
            const target = parseInt(targetStr, 10);
            
            if (!isNaN(target) && target > 0) {
                valElem.innerText = "0";
                countUpAnimation(target, 600, valElem); // slightly extended duration to 600ms for smoothness
            }
        }
    });

    // -------------------------------------------------------------
    // Dashboard Chart.js Integration
    // -------------------------------------------------------------
    const trendCtx = document.getElementById('trendChart');
    const pieCtx = document.getElementById('pieChart');

    if (trendCtx && pieCtx && window.Chart) {
        
        let pieData = { labels: [], data: [] };
        let trendData = { labels: [], data: [] };

        try {
            pieData = JSON.parse(document.getElementById('pie-chart-data').textContent);
            trendData = JSON.parse(document.getElementById('trend-chart-data').textContent);
        } catch (e) {
            console.error("Dashboard charts JSON parse error:", e);
        }

        // Apply global defaults for Chart.js
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = "#64748b"; // slate-500

        // 1) Trend Line Chart
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Items Borrowed',
                    data: trendData.data,
                    borderColor: '#2563eb', // blue-600
                    backgroundColor: 'rgba(37, 99, 235, 0.1)', // blue-600 with opacity
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // subtle curve
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12, weight: 'bold' },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { weight: '600' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', drawBorder: false }, // slate-100
                        ticks: { padding: 10, precision: 0 }
                    }
                }
            }
        });

        // 2) Status Pie Chart
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: pieData.labels,
                datasets: [{
                    data: pieData.data,
                    backgroundColor: [
                        '#10b981', // emerald-500 (Available)
                        '#0ea5e9', // sky-500 (Working)
                        '#f59e0b', // amber-500 (Repair)
                        '#f43f5e'  // rose-500 (Not Working)
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
                        titleFont: { size: 13 },
                        bodyFont: { size: 13, weight: 'bold' },
                        padding: 12,
                        cornerRadius: 8,
                    }
                }
            }
        });
    }
});
