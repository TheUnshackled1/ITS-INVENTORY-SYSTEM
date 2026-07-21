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
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = "#64748b"; // slate-500
        const trendWipePlugin = {
            id: 'trendWipe',
            beforeDatasetDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                if (!chartArea) return;
                if (!chart.trendWipeStart) {
                    chart.trendWipeStart = performance.now();
                }
                const elapsed = performance.now() - chart.trendWipeStart;
                const duration = 2000; 
                let progress = Math.min(elapsed / duration, 1);
                progress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
                ctx.save();
                ctx.beginPath();
                const totalWipeDistance = chartArea.width + 40;
                const currentWidth = totalWipeDistance * progress;
                ctx.rect(chartArea.left - 20, chartArea.top - 40, currentWidth, chartArea.height + 80);
                ctx.clip();      
                if (progress < 1) {
                    requestAnimationFrame(() => chart.update('none'));
                }
            },
            afterDatasetDraw: (chart) => {
                chart.ctx.restore();
            }
        };
        new Chart(trendCtx, {
            type: 'line',
            plugins: [trendWipePlugin],
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
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart',
                    onComplete: function(animation) {
                        const chart = animation.chart;
                        if (animation.initial && !chart.canvas.hasAttribute('data-pulsed')) {
                            chart.canvas.setAttribute('data-pulsed', 'true');      
                            const meta = chart.getDatasetMeta(0);
                            if (meta && meta.data && meta.data.length > 0) {
                                const lastPoint = meta.data[meta.data.length - 1];
                                const pulseDot = document.createElement('div');
                                pulseDot.style.position = 'absolute';
                                pulseDot.style.left = lastPoint.x + 'px';
                                pulseDot.style.top = lastPoint.y + 'px';
                                pulseDot.style.width = '12px';
                                pulseDot.style.height = '12px';
                                pulseDot.style.transform = 'translate(-50%, -50%)';
                                pulseDot.style.pointerEvents = 'none';
                                const ring = document.createElement('div');
                                ring.className = 'w-full h-full rounded-full bg-blue-500 animate-ping opacity-75';
                                pulseDot.appendChild(ring);
                                chart.canvas.parentElement.style.position = 'relative';
                                chart.canvas.parentElement.appendChild(pulseDot);
                            }
                        }
                    }
                },
                animations: {
                    y: { duration: 0 },
                    x: { duration: 0 },
                    colors: { duration: 0 }
                },
                layout: {
                    padding: { right: 25, top: 10 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        animation: {
                            duration: 150
                        },
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
        const customSpinPlugin = {
            id: 'customSpin',
            beforeDatasetDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                if (!chartArea) return;
                
                if (!chart.donutSpinStart) {
                    chart.donutSpinStart = performance.now();
                }
                const now = performance.now();
                const elapsed = now - chart.donutSpinStart;
                const duration = 2000;
                let progress = Math.min(elapsed / duration, 1);
                progress = 1 - Math.pow(1 - progress, 4);
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
                const radius = Math.max(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                ctx.save();
                const startSweep = -Math.PI / 2; 
                const endSweep = startSweep + (Math.PI * 2 * Math.max(progress, 0.001));
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startSweep, endSweep);
                ctx.closePath();
                ctx.clip();
                const angle = (1 - progress) * -Math.PI * 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                ctx.translate(-centerX, -centerY);
                if (progress < 1) {
                    requestAnimationFrame(() => chart.update('none'));
                }
            },
            afterDatasetDraw: (chart) => {
                chart.ctx.restore();
            }
        };
        new Chart(pieCtx, {
            type: 'doughnut',
            plugins: [customSpinPlugin],
            data: {
                labels: pieData.labels,
                datasets: [{
                    data: pieData.data,
                    backgroundColor: [
                        '#10b981', 
                        '#0ea5e9', 
                        '#f59e0b', 
                        '#f43f5e'  
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
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
