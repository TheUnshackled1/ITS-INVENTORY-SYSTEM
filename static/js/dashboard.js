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
});
