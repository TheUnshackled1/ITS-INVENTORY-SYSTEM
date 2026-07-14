document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    // ─── Step 1: Condition Modal elements ─────────────────────────────────────
    const conditionOverlay  = document.getElementById('returnConditionModalOverlay');
    const conditionCard     = document.getElementById('returnConditionModalCard');
    const conditionSubtitle = document.getElementById('returnConditionSubtitle');
    const conditionStatus   = document.getElementById('returnConditionStatus');
    const conditionNotes    = document.getElementById('returnConditionNotes');
    const cancelConditionBtn = document.getElementById('cancelConditionBtn');
    const nextConditionBtn  = document.getElementById('nextConditionBtn');

    // ─── Step 2: Confirm Return Modal elements ────────────────────────────────
    const returnOverlay    = document.getElementById('returnConfirmModalOverlay');
    const returnCard       = document.getElementById('returnConfirmModalCard');
    const returnText       = document.getElementById('returnConfirmText');
    const returnConditionLine = document.getElementById('returnConfirmCondition');
    const returnIdInput    = document.getElementById('returnIssuanceId');
    const cancelReturnBtn  = document.getElementById('cancelReturnBtn');
    const confirmReturnBtn = document.getElementById('confirmReturnBtn');

    // Friendly labels for the condition summary line
    const statusLabels = {
        available:   'Condition: Available (Good)',
        repair:      'Condition: Under Repair',
        not_working: 'Condition: Not Working (Defective)',
        lost:        'Condition: Lost',
        disposed:    'Condition: Disposed',
    };

    // ─── Open / Close helpers ─────────────────────────────────────────────────
    function openModal(overlay, card) {
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden', 'pointer-events-none');

        // Instantly snap card to far left
        card.style.transition = 'none';
        card.classList.remove('translate-x-0', 'translate-x-[100vw]', 'opacity-100');
        card.classList.add('-translate-x-[100vw]', 'opacity-0');

        void overlay.offsetWidth;
        void card.offsetWidth;

        // Slide into center
        card.style.transition = '';
        overlay.classList.remove('opacity-0');
        card.classList.remove('-translate-x-[100vw]', 'opacity-0');
        card.classList.add('translate-x-0', 'opacity-100');
    }

    function closeModal(overlay, card, cb) {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        card.classList.remove('translate-x-0', 'opacity-100');
        // Slide out to the right
        card.classList.add('translate-x-[100vw]', 'opacity-0');
        
        setTimeout(() => {
            overlay.style.display = 'none';
            if (cb) cb();
        }, 300);
    }

    // ─── Step 1: open condition modal ─────────────────────────────────────────
    function openConditionModal(id, borrower, item, qty, location) {
        returnIdInput.value = id;
        // Pre-populate subtitle
        conditionSubtitle.textContent = `Return ${qty}x "${item}" from ${borrower}`;
        // Reset to defaults
        conditionStatus.value = 'available';
        conditionNotes.value  = '';
        const locationInput = document.getElementById('returnConditionLocation');
        if (locationInput) locationInput.value = location || '';
        
        openModal(conditionOverlay, conditionCard);
    }

    // ─── Cancel condition modal ───────────────────────────────────────────────
    if (cancelConditionBtn) {
        cancelConditionBtn.addEventListener('click', () => closeModal(conditionOverlay, conditionCard));
    }
    if (conditionOverlay) {
        conditionOverlay.addEventListener('click', (e) => {
            if (e.target === conditionOverlay) closeModal(conditionOverlay, conditionCard);
        });
    }

    // ─── Next → : go from step 1 to step 2 ────────────────────────────────────
    if (nextConditionBtn) {
        nextConditionBtn.addEventListener('click', () => {
            const selectedStatus = conditionStatus.value;
            const notes          = conditionNotes.value.trim();

            // Build confirm summary text (carried from condition subtitle)
            const subtitle = conditionSubtitle.textContent; // "Return Nx "Item" from Borrower"
            returnText.textContent = subtitle + '?';
            returnConditionLine.textContent = statusLabels[selectedStatus] || '';

            // Close step 1, open step 2
            closeModal(conditionOverlay, conditionCard, () => {
                openModal(returnOverlay, returnCard);
            });
        });
    }

    // ─── Cancel confirm modal ("Back" button) ─────────────────────────────────
    if (cancelReturnBtn) {
        cancelReturnBtn.addEventListener('click', () => {
            closeModal(returnOverlay, returnCard, () => {
                openModal(conditionOverlay, conditionCard);
            });
        });
    }
    if (returnOverlay) {
        returnOverlay.addEventListener('click', (e) => {
            if (e.target === returnOverlay) closeModal(returnOverlay, returnCard);
        });
    }

    // ─── Attach .return-btn clicks (event delegation for datatable DOM regen) ─
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.return-btn');
        if (btn) {
            openConditionModal(
                btn.dataset.id,
                btn.dataset.borrower,
                btn.dataset.item,
                btn.dataset.qty,
                btn.dataset.location
            );
        }
    });

    // ─── Attach .log-item-details-trigger clicks (item details modal popup) ───
    document.body.addEventListener('click', function(e) {
        const trigger = e.target.closest('.log-item-details-trigger');
        if (trigger) {
            e.preventDefault();
            const itemType = trigger.getAttribute("data-item-type");
            
            const detailObj = {
                "Item Type": trigger.getAttribute("data-item-type") || "-",
                "Brand": trigger.getAttribute("data-brand") || "-",
                "Model": trigger.getAttribute("data-model") || "-",
                "Serial Number": trigger.getAttribute("data-serial") || "-",
                "Qty Borrowed": trigger.getAttribute("data-qty") || "-",
                "Inv Date": trigger.getAttribute("data-inv-date") || "-",
                "Disp Date": trigger.getAttribute("data-disp-date") || "-",
                "Location": trigger.getAttribute("data-location") || "-",
                "Status": trigger.getAttribute("data-status") || "-",
                "Defect": trigger.getAttribute("data-defect") || "-"
            };

            if (typeof window.openLogDetailModal === 'function') {
                window.openLogDetailModal(itemType, null, JSON.stringify(detailObj));
            }
        }
    });

    // ─── Confirm Return: send to backend ─────────────────────────────────────
    if (confirmReturnBtn) {
        confirmReturnBtn.addEventListener('click', function() {
            const id             = returnIdInput.value;
            const returnStatus   = conditionStatus.value;
            const notes          = conditionNotes.value.trim();
            const locationInput  = document.getElementById('returnConditionLocation');
            const returnLocation = locationInput ? locationInput.value.trim() : '';

            confirmReturnBtn.disabled     = true;
            confirmReturnBtn.textContent  = 'Returning...';

            fetch(`/borrowing/${id}/return/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ 
                    return_status: returnStatus, 
                    notes: notes,
                    location: returnLocation 
                }),
            })
            .then(r => r.json())
            .then(data => {
                closeModal(returnOverlay, returnCard);
                if (data.success) {
                    if (typeof window.showSuccessModal === 'function') {
                        window.showSuccessModal('Item has been successfully returned!');
                    }
                    setTimeout(() => location.reload(), 1500);
                } else {
                    if (typeof window.showErrorModal === 'function') {
                        window.showErrorModal(data.error || 'Something went wrong.');
                    }
                }
            })
            .catch(() => {
                closeModal(returnOverlay, returnCard);
                if (typeof window.showErrorModal === 'function') {
                    window.showErrorModal('Network error. Please try again.');
                }
            })
            .finally(() => {
                confirmReturnBtn.disabled    = false;
                confirmReturnBtn.textContent = 'Return';
            });
        });
    }

    // ─── Initialize SimpleDatatables ─────────────────────────────────────────
    const tableEl = document.getElementById('borrowing-table');
    if (tableEl && window.simpleDatatables) {
        // Load ALL rows into DOM at once for custom pagination engine
        const dataTable = new window.simpleDatatables.DataTable(tableEl, {
            searchable: false,
            sortable: false,
            fixedHeight: false,
            perPageSelect: false,
            perPage: 100000,
        });

        // ----- Custom Pagination Engine -----
        const PAGE_SIZE = 15;
        let currentPage = 1;

        function getAllRows() {
            const tbody = tableEl.querySelector("tbody");
            return tbody ? Array.from(tbody.querySelectorAll("tr:not(.no-results-row)")) : [];
        }

        function renderPage() {
            const all = getAllRows();
            all.forEach(r => r.style.display = "none");

            let activeRows = all;
            if (activeRows.length === 0) {
                let noRow = tableEl.querySelector(".no-results-row");
                if (!noRow) {
                    noRow = document.createElement("tr");
                    noRow.className = "no-results-row";
                    const colCount = tableEl.querySelectorAll("thead th").length;
                    noRow.innerHTML = `<td colspan="${colCount}" class="text-center py-8 text-slate-400 text-sm font-medium">No results found</td>`;
                    const tbody = tableEl.querySelector("tbody");
                    if (tbody) tbody.appendChild(noRow);
                }
                noRow.style.display = "";
            } else {
                const noRow = tableEl.querySelector(".no-results-row");
                if (noRow) noRow.remove();

                const start = (currentPage - 1) * PAGE_SIZE;
                activeRows.slice(start, start + PAGE_SIZE).forEach(r => r.style.display = "");
            }
            renderPagination(activeRows);
        }

        function renderPagination(activeRows) {
            const bottomBar = tableEl.closest('.datatable-wrapper') ? tableEl.closest('.datatable-wrapper').querySelector('.datatable-bottom') : document.querySelector(".datatable-bottom");
            if (!bottomBar) return;

            const totalRows = activeRows.length;
            const totalPages = Math.ceil(totalRows / PAGE_SIZE);
            const start = totalRows === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
            const end = Math.min(currentPage * PAGE_SIZE, totalRows);

            let pagesHtml = '';
            let pageNumbers = [];
            
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
            } else {
                if (currentPage <= 4) {
                    pageNumbers = [1, 2, 3, 4, 5, '...', totalPages];
                } else if (currentPage >= totalPages - 3) {
                    pageNumbers = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                } else {
                    pageNumbers = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                }
            }
            
            pageNumbers.forEach(p => {
                if (p === '...') {
                    pagesHtml += `
                      <li class="datatable-pagination-list-item pointer-events-none">
                        <button class="datatable-pagination-list-item-link" style="background:transparent; border:none; box-shadow:none; color:#64748b; font-weight:bold;">&hellip;</button>
                      </li>`;
                } else {
                    let activeStyle = p === currentPage ? 'style="background-color: #0f172a !important; color: white !important; border-color: #0f172a !important;"' : '';
                    pagesHtml += `
                      <li class="datatable-pagination-list-item ${p === currentPage ? "datatable-active" : ""}">
                        <button data-page="${p}" class="datatable-pagination-list-item-link" ${activeStyle}>${p}</button>
                      </li>`;
                }
            });

            const formattedTotal = totalRows.toLocaleString();

            bottomBar.innerHTML = `
              <div class="datatable-info shrink-0 text-slate-700 font-medium tracking-wide" style="font-size:0.875rem">${start}-${end} of ${formattedTotal}</div>
              
              <nav class="datatable-pagination flex-1 flex justify-center">
                <ul class="datatable-pagination-list" style="display:flex; align-items:center; gap:0.25rem;">
                  <li class="datatable-pagination-list-item ${currentPage === 1 ? "datatable-disabled opacity-50 pointer-events-none" : ""}" style="background: transparent !important; border: none !important; box-shadow: none !important;">
                <button data-page="${currentPage - 1}" class="datatable-pagination-list-item-link" style="background: transparent !important; border: none !important; box-shadow: none !important; color: #94a3b8 !important;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#94a3b8'">&lsaquo; Back</button>
              </li>
                  ${pagesHtml}
                  <li class="datatable-pagination-list-item ${currentPage === totalPages || totalPages === 0 ? "datatable-disabled opacity-50 pointer-events-none" : ""}" style="background: transparent !important; border: none !important; box-shadow: none !important;">
                <button data-page="${currentPage + 1}" class="datatable-pagination-list-item-link" style="background: transparent !important; border: none !important; box-shadow: none !important; color: #94a3b8 !important;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#94a3b8'">Next &rsaquo;</button>
              </li>
                </ul>
              </nav>

              <div class="datatable-jump shrink-0 flex items-center gap-2">
                <span class="text-sm font-medium text-slate-700">Page</span>
                <input type="number" min="1" max="${totalPages}" value="${currentPage}" class="dt-jump-input w-16 text-center border border-slate-200 rounded focus:border-slate-900 focus:ring-1 focus:ring-slate-900 h-[38px] text-sm font-bold text-slate-800 shadow-sm" style="padding-top:0; padding-bottom:0;" />
                <button type="button" class="dt-jump-btn font-extrabold text-sm text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded px-3 h-[38px] transition-colors">Go</button>
              </div>
            `;

            bottomBar.querySelectorAll("button[data-page]").forEach(btn => {
              btn.addEventListener("click", function () {
                const page = parseInt(this.dataset.page);
                if (page < 1 || page > totalPages) return;
                currentPage = page;
                renderPage();
                tableEl.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });
            
            const jumpBtn = bottomBar.querySelector(".dt-jump-btn");
            const jumpInput = bottomBar.querySelector(".dt-jump-input");
            if (jumpBtn && jumpInput) {
                const doJump = () => {
                    let page = parseInt(jumpInput.value);
                    if (!isNaN(page)) {
                       if (page < 1) page = 1;
                       if (page > totalPages) page = totalPages;
                       if (page !== currentPage) {
                          currentPage = page;
                          renderPage();
                          tableEl.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                       }
                    }
                };
                jumpBtn.addEventListener("click", doJump);
                jumpInput.addEventListener("keydown", (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doJump();
                    }
                });
            }
        }
        
        // Let Simple Datatables build the DOM, then render our engine immediately
        dataTable.on('datatable.init', () => {
            renderPage();
        });
    }
});
