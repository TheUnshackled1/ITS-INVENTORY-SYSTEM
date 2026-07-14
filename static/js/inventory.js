
// UI and DataTables Initialization
document.addEventListener("DOMContentLoaded", function () {
  // Check for pending success popups from native navigation
  const pendingSuccess = localStorage.getItem("showSuccessModalFlag");
  if (pendingSuccess) {
    localStorage.removeItem("showSuccessModalFlag");
    setTimeout(() => {
      if (typeof window.showSuccessModal === "function") {
        let successMessage = "Congratulations your record has been successfully added";
        if (pendingSuccess === "edited") successMessage = "Congratulations your record has been successfully edited";
        if (pendingSuccess === "deleted") successMessage = "Congratulations your record has been successfully deleted";
        if (pendingSuccess === "borrowed") successMessage = "Item has been successfully borrowed";
        if (pendingSuccess === "no_changes") {
            if (typeof window.showInfoModal === "function") {
                window.showInfoModal("No changes were made to this record.");
            }
        } else {
            window.showSuccessModal(successMessage);
        }
      }
    }, 150);
  }

  const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined || unsafe === '') return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  };

  // --- Card Numbers Count-Up Animation ---
  const statNumbers = document.querySelectorAll("#stats-cards-container p.text-3xl");
  if (statNumbers.length > 0) {
    statNumbers.forEach(el => {
      const targetStr = el.textContent.trim();
      const target = parseInt(targetStr, 10);
      
      if (!isNaN(target) && target > 0) {
        el.textContent = "0";
        const duration = 5000; // 5 seconds
        const start = performance.now();
        
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic formula for smooth deceleration
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          el.textContent = Math.floor(easeOut * target);
          
          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            el.textContent = target; // Ensure exact final value
          }
        };
        
        window.requestAnimationFrame(step);
      }
    });
  }

  // Sidebar Toggle Logic
  const sidebarToggle = document.getElementById("sidebarToggle");
  const appShell = document.querySelector(".app-shell");
  
  if (appShell) {
    if (localStorage.getItem("sidebarCollapsed") === "true") {
      appShell.classList.add("app-shell--collapsed");
    }
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        appShell.classList.toggle("app-shell--collapsed");
        localStorage.setItem("sidebarCollapsed", appShell.classList.contains("app-shell--collapsed"));
      });
    }
  }

  // JSON-based Bulk Rendering Logic
  const jsonDataElement = document.getElementById("inventory-data");
  const tbodyElement = document.getElementById("inventory-tbody");

  if (jsonDataElement && tbodyElement) {
    try {
      const inventoryData = JSON.parse(jsonDataElement.textContent);
      let htmlRows = [];
      const len = inventoryData.length;
      
      for (let i = 0; i < len; i++) {
        const item = inventoryData[i];
        
        let statusBadge = "";
        let statusValue = item.status || "available";
        let displayStatus = item.get_status_display || statusValue.toUpperCase();
        
        if (statusValue === 'available') {
            statusBadge = `<span class="inline-flex justify-center flex-shrink-0 items-center gap-1.5 w-28 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                <svg class="h-1.5 w-1.5 fill-emerald-600" viewBox="0 0 6 6" aria-hidden="true"><circle cx="3" cy="3" r="3" /></svg>${displayStatus}
            </span>`;
        } else if (statusValue === 'in_use') {
            statusBadge = `<span class="inline-flex justify-center flex-shrink-0 items-center gap-1.5 w-max px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-600">
                <svg class="h-1.5 w-1.5 flex-shrink-0 fill-current" viewBox="0 0 6 6" aria-hidden="true"><circle cx="3" cy="3" r="3" /></svg>${displayStatus}
            </span>`;
        } else if (statusValue === 'repair') {
            statusBadge = `<span class="inline-flex justify-center flex-shrink-0 items-center gap-1.5 w-max px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                <svg class="h-1.5 w-1.5 flex-shrink-0 fill-current" viewBox="0 0 6 6" aria-hidden="true"><circle cx="3" cy="3" r="3" /></svg>${displayStatus}
            </span>`;
        } else {
            statusBadge = `<span class="inline-flex justify-center flex-shrink-0 items-center gap-1.5 w-max px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                <svg class="h-1.5 w-1.5 flex-shrink-0 fill-current" viewBox="0 0 6 6" aria-hidden="true"><circle cx="3" cy="3" r="3" /></svg>${displayStatus}
            </span>`;
        }

        let defectBadge = item.defect_description ? escapeHtml(item.defect_description) : `<span class="text-slate-400">-</span>`;
        htmlRows.push(`
          <tr class="inventory-row transition-colors hover:bg-slate-50/80 cursor-pointer"
              data-id="${item.pk}"
              data-type="${escapeHtml(item.item_type)}"
              data-desc="${escapeHtml(item.item_description)}"
              data-brand="${escapeHtml(item.brand)}"
              data-model="${escapeHtml(item.model)}"
              data-serial="${escapeHtml(item.serial_number)}"
              data-qty="${item.quantity !== null ? escapeHtml(item.quantity) : 1}"
              data-invdate="${escapeHtml(item.date_inventory_raw)}"
              data-dispdate="${escapeHtml(item.date_disposal_raw)}"
              data-location="${escapeHtml(item.location)}"
              data-status="${escapeHtml(statusValue)}"
              data-defect="${escapeHtml(item.defect_description)}"
              data-borrowings='${escapeHtml(JSON.stringify(item.active_borrowings || []))}'>
            <td class="px-2 py-2 align-middle font-semibold text-slate-900 text-xs">${escapeHtml(item.original_no)}</td>
            <td class="px-2 py-2 align-middle text-xs font-semibold leading-tight text-slate-900"><span class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"><span>${escapeHtml(item.item_type) || "-"}</span><svg class="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4M12 8h.01"/></svg></span></td>
            <td class="px-2 py-2 align-middle text-xs text-slate-600" title="${escapeHtml(item.item_description)}"><span class="block w-full text-center">${escapeHtml(item.item_description) || "-"}</span></td>
            <td class="px-2 py-2 align-middle text-xs font-medium text-slate-800"><span class="block w-full text-center">${escapeHtml(item.brand) || "-"}</span></td>
            <td class="px-2 py-2 align-middle text-xs font-medium text-slate-800"><span class="block w-full text-center">${escapeHtml(item.model) || "-"}</span></td>
            <td class="px-2 py-2 align-middle font-mono text-[11px] text-slate-700" title="${escapeHtml(item.serial_number)}">${escapeHtml(item.serial_number) || "-"}</td>
            <td class="px-2 py-2 align-middle text-xs font-semibold text-slate-900">${item.quantity !== null ? escapeHtml(item.quantity) : "-"}</td>
            <td class="px-2 py-2 align-middle text-xs text-slate-700">${item.date_inventory_ui}</td>
            <td class="px-2 py-2 align-middle text-xs text-slate-700">${item.date_disposal_ui}</td>
            <td class="px-2 py-2 align-middle text-center text-xs text-slate-700" title="${escapeHtml(item.location)}">${escapeHtml(item.location) || "-"}</td>
            <td class="px-2 py-2 align-middle text-center">${statusBadge}</td>
            <td class="px-2 py-2 align-middle text-xs text-slate-600 uppercase" title="${escapeHtml(item.defect_description)}">${defectBadge}</td>
          </tr>
        `);
      }
      tbodyElement.innerHTML = htmlRows.join("");
    } catch (e) {
      console.error("Failed to parse inventory JSON:", e);
    }
  }

  // DataTable Logic
  const dataTablesElements = document.querySelectorAll("#inventory-table, #activity-log-table");
  
  dataTablesElements.forEach(tableEl => {
    let dataTable = null;
    
    if (window.simpleDatatables) {
      // Load ALL rows into DOM at once (no internal DT pagination)
      dataTable = new window.simpleDatatables.DataTable(tableEl, {
        searchable: false,
        sortable: false,
        fixedHeight: false,
        perPageSelect: false,
        perPage: 100000,
      });

      // ----- Custom Search + Pagination Engine -----
      const PAGE_SIZE = 50;
      let currentPage = 1;
      let activeRows = []; // currently matching rows

      function getAllRows() {
        const tbody = tableEl.querySelector("tbody");
        return tbody ? Array.from(tbody.querySelectorAll("tr:not(.no-results-row)")) : [];
      }

      function renderPage() {
        const all = getAllRows();
        // Hide every row first
        all.forEach(r => r.style.display = "none");

        if (activeRows.length === 0) {
          // Show no-results
          let noRow = tableEl.querySelector(".no-results-row");
          if (!noRow) {
            noRow = document.createElement("tr");
            noRow.className = "no-results-row";
            const colCount = tableEl.querySelectorAll("thead th").length;
            noRow.innerHTML = `<td colspan="${colCount}" class="text-center py-8 text-slate-400 text-sm font-medium">No results match your search query</td>`;
            const tbody = tableEl.querySelector("tbody");
            if (tbody) tbody.appendChild(noRow);
          }
          noRow.style.display = "";
        } else {
          // Remove any stale no-results row
          const noRow = tableEl.querySelector(".no-results-row");
          if (noRow) noRow.remove();

          // Show current page slice
          const start = (currentPage - 1) * PAGE_SIZE;
          activeRows.slice(start, start + PAGE_SIZE).forEach(r => r.style.display = "");
        }

        renderPagination();
      }

      function renderPagination() {
        const bottomBar = document.querySelector(".datatable-bottom");
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

      function applySearch(query) {
        const all = getAllRows();
        currentPage = 1;
        activeRows = query
          ? all.filter(row => {
              const text = Array.from(row.querySelectorAll("td")).map(td => td.textContent.trim().toUpperCase()).join(" ");
              return text.includes(query.toUpperCase());
            })
          : all;
        renderPage();
      }

      // Initial render: show page 1 with all rows
      activeRows = getAllRows();
      renderPage();

      // Wire up the custom search input
      const customSearch = document.getElementById("filter-search");
      if (customSearch) {
        customSearch.addEventListener("input", function () {
          applySearch(this.value.trim());
        });
      }
    }
  });

  // Global auto-uppercase for all text inputs and textareas
  document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Skip if it's a date, hidden, file, or number field
      if (e.target.type !== 'date' && e.target.type !== 'hidden' && e.target.type !== 'file' && e.target.type !== 'number') {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        
        // Restore cursor position if available
        if (start !== null && end !== null) {
          e.target.setSelectionRange(start, end);
        }
      }
    }
  });

  // --- Auto-expanding Textareas ---
  function adjustTextareaHeight(el) {
    // Reset height to evaluate raw scrollHeight
    el.style.height = 'auto';
    
    // In border-box layouts (like Tailwind), scrollHeight doesn't include borders,
    // so setting height to scrollHeight shrinks the content area slightly,
    // causing scrolling or continuous jittery growth. We must add the border widths safely.
    const style = window.getComputedStyle(el);
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const borderBottom = parseFloat(style.borderBottomWidth) || 0;
    
    el.style.height = (el.scrollHeight + borderTop + borderBottom) + 'px';
  }

  document.querySelectorAll('textarea').forEach(textarea => {
    // Add overflow-hidden in JS just in case it's missed in HTML
    textarea.style.overflow = 'hidden';
    // Adjust initially
    adjustTextareaHeight(textarea);
    // Listen to input
    textarea.addEventListener('input', function() {
      adjustTextareaHeight(this);
    });
  });

  // --- Side Drawer Modal Controller ---
  const sideDrawerModal = document.getElementById("sideDrawerModal");
  const sideDrawerOverlay = document.getElementById("sideDrawerOverlay");
  const sideDrawerPanel = document.getElementById("sideDrawerPanel");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const inventoryForm = document.getElementById("inventoryForm");
  const saveRecordBtn = document.getElementById("saveRecordBtn");
  const modalTitle = document.getElementById("modalTitle");
  
  let isEditing = false;
  let editingRow = null;

  function openDrawer(title = "Add Inventory Record") {
    modalTitle.textContent = title;
    sideDrawerModal.style.display = "block"; // Remove inline display:none
    sideDrawerModal.classList.remove("hidden");
    // Trigger reflow for transitions
    void sideDrawerModal.offsetWidth;
    sideDrawerOverlay.classList.remove("opacity-0");
    sideDrawerOverlay.classList.add("opacity-100");
    sideDrawerPanel.classList.remove("translate-x-full");
    sideDrawerPanel.classList.add("translate-x-0");
  }

  function closeDrawer() {
    sideDrawerOverlay.classList.remove("opacity-100");
    sideDrawerOverlay.classList.add("opacity-0");
    sideDrawerPanel.classList.remove("translate-x-0");
    sideDrawerPanel.classList.add("translate-x-full");
    
    // Wait for animation to finish
    setTimeout(() => {
      sideDrawerModal.classList.add("hidden");
      sideDrawerModal.style.display = "none"; // Re-hide perfectly
      inventoryForm.reset();
      // Reset textareas to default height
      document.querySelectorAll('textarea').forEach(ta => ta.style.height = 'auto');
      document.getElementById("form_id").value = "";
      isEditing = false;
      editingRow = null;
    }, 300);
  }

  // Close handlers
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
  if (sideDrawerOverlay) sideDrawerOverlay.addEventListener("click", closeDrawer);

  // --- Success Modal Controller ---
  const successModalOverlay = document.getElementById("successModalOverlay");
  const successModalCard = document.getElementById("successModalCard");
  const successModalMessage = document.getElementById("successModalMessage");
  const successModalCloseBtn = document.getElementById("successModalCloseBtn");

  window.showSuccessModal = function(msg = "Congratulations your record has been successfully saved") {
    if (successModalMessage) successModalMessage.textContent = msg;
    if (successModalOverlay && successModalCard) {
      successModalOverlay.style.display = "flex"; // Remove inline display:none
      successModalOverlay.classList.remove("hidden", "pointer-events-none");
      // Trigger reflow
      void successModalOverlay.offsetWidth;
      successModalOverlay.classList.remove("opacity-0");
      
      successModalCard.classList.remove("scale-95", "opacity-0");
      successModalCard.classList.add("scale-100", "opacity-100");
    }
  };

  const closeSuccessModal = function() {
    if (successModalOverlay && successModalCard) {
      successModalOverlay.classList.add("opacity-0");
      successModalCard.classList.remove("scale-100", "opacity-100");
      successModalCard.classList.add("scale-95", "opacity-0");
      
      setTimeout(() => {
        successModalOverlay.classList.add("hidden", "pointer-events-none");
        successModalOverlay.style.display = "none";
      }, 300);
    }
  };

  if (successModalCloseBtn) successModalCloseBtn.addEventListener("click", closeSuccessModal);

  // --- Error Modal Controller ---
  const errorModalOverlay = document.getElementById("errorModalOverlay");
  const errorModalCard = document.getElementById("errorModalCard");
  const errorModalMessage = document.getElementById("errorModalMessage");
  const errorModalCloseBtn = document.getElementById("errorModalCloseBtn");

  window.showErrorModal = function(msg = "Ooops.. something wrong, try one more time") {
    if (errorModalMessage) errorModalMessage.textContent = msg;
    if (errorModalOverlay && errorModalCard) {
      errorModalOverlay.style.display = "flex"; // Remove inline display:none
      errorModalOverlay.classList.remove("hidden", "pointer-events-none");
      // Trigger reflow
      void errorModalOverlay.offsetWidth;
      errorModalOverlay.classList.remove("opacity-0");
      
      errorModalCard.classList.remove("scale-95", "opacity-0");
      errorModalCard.classList.add("scale-100", "opacity-100");
    }
  };

  const closeErrorModal = function() {
    if (errorModalOverlay && errorModalCard) {
      errorModalOverlay.classList.add("opacity-0");
      errorModalCard.classList.remove("scale-100", "opacity-100");
      errorModalCard.classList.add("scale-95", "opacity-0");
      
      setTimeout(() => {
        errorModalOverlay.classList.add("hidden", "pointer-events-none");
        errorModalOverlay.style.display = "none";
      }, 300);
    }
  };

  if (errorModalCloseBtn) errorModalCloseBtn.addEventListener("click", closeErrorModal);

  // --- Info Modal Controller ---
  const infoModalOverlay = document.getElementById("infoModalOverlay");
  const infoModalCard = document.getElementById("infoModalCard");
  const infoModalMessage = document.getElementById("infoModalMessage");
  const infoModalCloseBtn = document.getElementById("infoModalCloseBtn");

  window.showInfoModal = function(msg = "Info") {
    if (infoModalMessage) infoModalMessage.textContent = msg;
    if (infoModalOverlay && infoModalCard) {
      infoModalOverlay.style.display = "flex"; // Remove inline display:none
      infoModalOverlay.classList.remove("hidden", "pointer-events-none");
      // Trigger reflow
      void infoModalOverlay.offsetWidth;
      infoModalOverlay.classList.remove("opacity-0");
      
      infoModalCard.classList.remove("scale-95", "opacity-0");
      infoModalCard.classList.add("scale-100", "opacity-100");
    }
  };

  const closeInfoModal = function() {
    if (infoModalOverlay && infoModalCard) {
      infoModalOverlay.classList.add("opacity-0");
      infoModalCard.classList.remove("scale-100", "opacity-100");
      infoModalCard.classList.add("scale-95", "opacity-0");
      
      setTimeout(() => {
        infoModalOverlay.classList.add("hidden", "pointer-events-none");
        infoModalOverlay.style.display = "none";
      }, 300);
    }
  };

  if (infoModalCloseBtn) infoModalCloseBtn.addEventListener("click", closeInfoModal);

  // --- Log Detail Modal Controller ---
  const logDetailModalOverlay = document.getElementById("logDetailModalOverlay");
  const logDetailModalCard = document.getElementById("logDetailModalCard");
  const logDetailItemType = document.getElementById("logDetailItemType");
  const logDetailSummary = document.getElementById("logDetailSummary");
  const logDetailModalCloseBtn = document.getElementById("logDetailModalCloseBtn");

  window.openLogDetailModal = function(itemType, summary, detailsJSON) {
    if (logDetailItemType) logDetailItemType.textContent = itemType || "-";
    if (logDetailSummary) {
      let html = '';
      let detailObj = null;
      let summaryText = summary;

      if (detailsJSON && detailsJSON !== "None") {
        try { detailObj = JSON.parse(detailsJSON); } catch(e) { console.error("Could not parse detailsJSON", e); }
      }
      
      // Fallback for old logs where summary IS the JSON
      if (!detailObj && summaryText) {
        try {
          detailObj = JSON.parse(summaryText);
          summaryText = null; // Don't render JSON as raw text
        } catch(e) {}
      }

      if (detailObj) {
        if (detailObj.before && detailObj.after) {
          if (logDetailModalCard) {
            logDetailModalCard.classList.remove("max-w-md", "max-w-xl", "max-w-lg", "max-w-4xl");
            logDetailModalCard.classList.add("max-w-[520px]");
          }
          
          let beforeHtml = '<div class="grid grid-cols-2 gap-x-2 gap-y-4 text-left w-full">';
          for (const [k, v] of Object.entries(detailObj.before)) {
            if (k.startsWith('_')) continue;
            let changed = (v !== detailObj.after[k]);
            let valColor = changed ? "text-white bg-rose-700 px-1.5 py-0.5 rounded shadow-sm border border-rose-800 w-fit inline-block" : "text-slate-800";
            beforeHtml += `
              <div class="col-span-1 flex flex-col">
                <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">${k}</span>
                <span class="text-xs font-semibold ${valColor} break-words">${v}</span>
              </div>
            `;
          }
          beforeHtml += '</div>';

          let afterHtml = '<div class="grid grid-cols-2 gap-x-2 gap-y-4 text-left w-full">';
          for (const [k, v] of Object.entries(detailObj.after)) {
            if (k.startsWith('_')) continue;
            let changed = (v !== detailObj.before[k]);
            let valColor = changed ? "text-white bg-blue-600 px-1.5 py-0.5 rounded shadow-sm border border-blue-700 w-fit inline-block" : "text-slate-800";
            afterHtml += `
              <div class="col-span-1 flex flex-col">
                <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">${k}</span>
                <span class="text-xs font-semibold ${valColor} break-words">${v}</span>
              </div>
            `;
          }
          afterHtml += '</div>';

          html += `
            <div class="flex flex-col md:flex-row items-stretch justify-center gap-3 w-full relative">
              <!-- Original State -->
              <div class="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-left">
                <div class="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Original</div>
                <h4 class="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Previous Record
                </h4>
                ${beforeHtml}
              </div>

              <!-- Arrow Separator -->
              <div class="flex items-center justify-center shrink-0 md:self-center py-2 md:py-0 relative z-10 w-8">
                <!-- Desktop Right Arrow -->
                <div class="hidden md:flex w-8 h-8 rounded-full bg-blue-50 items-center justify-center text-blue-500 shadow-sm border border-blue-200 ring-4 ring-white absolute">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </div>
                <!-- Mobile Down Arrow -->
                <div class="flex md:hidden w-8 h-8 rounded-full bg-blue-50 items-center justify-center text-blue-500 shadow-sm border border-blue-200 ring-4 ring-white absolute">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                </div>
              </div>

              <!-- Changed State -->
              <div class="flex-1 bg-white p-4 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden ring-2 ring-blue-500/10 text-left">
                <div class="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">Updated</div>
                <h4 class="text-xs font-bold text-blue-700 mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  New Record
                </h4>
                ${afterHtml}
              </div>
            </div>
          `;
        } else {
          if (logDetailModalCard) {
            logDetailModalCard.classList.remove("max-w-4xl", "max-w-xl", "max-w-lg", "max-w-[520px]", "max-w-md");
            logDetailModalCard.classList.add("max-w-[370px]");
          }
          
          html += '<div class="grid grid-cols-2 gap-x-4 gap-y-5 text-left w-full mt-2 pb-2">';
          for (const [k, v] of Object.entries(detailObj)) {
            if (k.startsWith('_')) continue;
            html += `
              <div class="col-span-1 flex flex-col">
                <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">${k}</span>
                <span class="text-xs font-semibold text-slate-800 break-words">${v}</span>
              </div>
            `;
          }
          html += '</div>';
        }
      }
      
      if (summaryText && !detailObj) {
        // Only show plain text if there's no grid available
        html += `
          <div class="w-full text-left mt-2">
             <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 block">Details</span>
             <div class="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">${summaryText}</div>
          </div>
        `;
      }
      
      logDetailSummary.innerHTML = html;
      logDetailSummary.className = "text-sm font-medium text-slate-600 leading-relaxed w-full max-h-[60vh] overflow-y-auto custom-scrollbar";
    }
    if (logDetailModalOverlay && logDetailModalCard) {
      logDetailModalOverlay.style.display = "flex";
      logDetailModalOverlay.classList.remove("hidden", "pointer-events-none");
      // Trigger reflow
      void logDetailModalOverlay.offsetWidth;
      logDetailModalOverlay.classList.remove("opacity-0");
      
      logDetailModalCard.classList.remove("scale-95", "opacity-0");
      logDetailModalCard.classList.add("scale-100", "opacity-100");
    }
  };

  const closeLogDetailModal = function() {
    if (logDetailModalOverlay && logDetailModalCard) {
      logDetailModalOverlay.classList.add("opacity-0");
      logDetailModalCard.classList.remove("scale-100", "opacity-100");
      logDetailModalCard.classList.add("scale-95", "opacity-0");
      
      setTimeout(() => {
        logDetailModalOverlay.classList.add("hidden", "pointer-events-none");
        logDetailModalOverlay.style.display = "none";
      }, 300);
    }
  };

  if (logDetailModalCloseBtn) logDetailModalCloseBtn.addEventListener("click", closeLogDetailModal);
  if (logDetailModalOverlay) logDetailModalOverlay.addEventListener("click", function(e) {
    if (e.target === logDetailModalOverlay) {
      closeLogDetailModal();
    }
  });

  // Attach click listener to log item links (using event delegation for simplicity or individual listeners)
  document.addEventListener("click", function(e) {
    const trigger = e.target.closest(".log-item-type");
    if (trigger) {
      e.preventDefault();
      const itemType = trigger.getAttribute("data-item");
      const summary = trigger.getAttribute("data-summary");
      const details = trigger.getAttribute("data-details");
      openLogDetailModal(itemType, summary, details);
    }
  });

  // Add Record Action
  const addModalHandler = () => {
    isEditing = false;
    inventoryForm.reset();
    document.getElementById("form_id").value = "";
    const submitBtn = document.getElementById("saveRecordBtn");
    const deleteBtn = document.getElementById("deleteRecordBtn");
    if (submitBtn) submitBtn.textContent = "Save Record";
    if (deleteBtn) deleteBtn.classList.add("hidden");
    const borrowBtn = document.getElementById("borrowRecordBtn");
    if (borrowBtn) borrowBtn.classList.add("hidden");
    openDrawer("Add Inventory Record");
  };

  if (openAddModalBtn) openAddModalBtn.addEventListener("click", addModalHandler);
  
  const openAddModalBtnTop = document.getElementById("openAddModalBtnTop");
  if (openAddModalBtnTop) openAddModalBtnTop.addEventListener("click", addModalHandler);

  // Open modal when clicking a row (Event Delegation)
  document.addEventListener("click", function(e) {
    const row = e.target.closest(".inventory-row");
    const activeTable = document.getElementById("inventory-table");
    
    if (row && activeTable && activeTable.contains(row)) {
      isEditing = true;
      editingRow = row;
      document.getElementById("form_id").value = row.dataset.id || "";
      
      const submitBtn = document.getElementById("saveRecordBtn");
      const deleteBtn = document.getElementById("deleteRecordBtn");
      if (submitBtn) submitBtn.textContent = "Edit Record";
      if (deleteBtn) deleteBtn.classList.remove("hidden");
      
      // Show Borrow button only when available and qty > 0
      const borrowBtn = document.getElementById("borrowRecordBtn");
      if (borrowBtn) {
        const rowStatus = (row.dataset.status || '').toLowerCase();
        const rowQty = parseInt(row.dataset.qty || '0', 10);
        if (rowStatus === 'available' && rowQty > 0) {
          borrowBtn.classList.remove('hidden');
        } else {
          borrowBtn.classList.add('hidden');
        }
      }
      
      document.getElementById("form_item_type").value = row.dataset.type || "";
      document.getElementById("form_brand").value = row.dataset.brand || "";
      document.getElementById("form_model").value = row.dataset.model || "";
      document.getElementById("form_serial_number").value = row.dataset.serial || "";
      document.getElementById("form_status").value = (row.dataset.status || "available").toLowerCase();
      document.getElementById("form_quantity").value = row.dataset.qty || "1";
      document.getElementById("form_date_inventory").value = row.dataset.invdate || "";
      document.getElementById("form_date_disposal").value = row.dataset.dispdate || "";
      document.getElementById("form_location").value = row.dataset.location || "";
      document.getElementById("form_item_description").value = row.dataset.desc || "";
      document.getElementById("form_defect_description").value = row.dataset.defect || "";
      
      // Populate active borrowings
      const activeBorrowingsContainer = document.getElementById("active_borrowings_container");
      const activeBorrowingsList = document.getElementById("active_borrowings_list");
      if (activeBorrowingsContainer && activeBorrowingsList) {
        let borrowings = [];
        try {
          borrowings = JSON.parse(row.dataset.borrowings || "[]");
        } catch (e) {}
        
        if (borrowings && borrowings.length > 0) {
          activeBorrowingsList.innerHTML = borrowings.map(b => 
            `<div class="bg-white px-3 py-2.5 rounded-lg flex items-center justify-start gap-2 text-sm shadow-sm border border-slate-100 flex-wrap">
                <span class="font-bold text-slate-800">${escapeHtml(b.borrower_name)}</span>
                <span class="text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">${escapeHtml(b.office_location)}</span>
                <span class="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">QTY: ${escapeHtml(b.qty)}</span>
            </div>`
          ).join('');
          activeBorrowingsContainer.classList.remove("hidden");
          activeBorrowingsContainer.classList.add("flex");
        } else {
          activeBorrowingsContainer.classList.add("hidden");
          activeBorrowingsContainer.classList.remove("flex");
          activeBorrowingsList.innerHTML = '';
        }
      }
      
      // Auto-expand dynamically injected content
      setTimeout(() => {
        document.querySelectorAll('textarea').forEach(ta => {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
        });
      }, 0);
      
      openDrawer("Edit Inventory Record");
    }
  });

  // Save Record AJAX Action
  if (saveRecordBtn && inventoryForm) {
    saveRecordBtn.addEventListener("click", () => {
      const formData = new FormData(inventoryForm);
      if (!formData.get("quantity") || formData.get("quantity") === "") {
        formData.set("quantity", "1");
      }
      
      let itemId = formData.get("id");
      const url = isEditing && itemId ? `/inventory/${itemId}/edit/` : `/inventory/add/`;
      
      const prevText = saveRecordBtn.textContent;
      saveRecordBtn.textContent = "Saving...";
      saveRecordBtn.disabled = true;

      fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json"
        }
      })
      .then(response => response.json())
      .then(data => {
        saveRecordBtn.textContent = prevText;
        saveRecordBtn.disabled = false;
        
        if (data.success) {
          closeDrawer();
          
          if (data.no_changes) {
              localStorage.setItem("showSuccessModalFlag", "no_changes");
          } else {
              localStorage.setItem("showSuccessModalFlag", isEditing ? "edited" : "added");
          }
          
          // Refresh the page natively to guarantee perfect DataTable indexing
          window.location.reload();
        } else {
          // Display validation errors!
          let errorMsg = "Could not save record. Please check your inputs.";
          if (data.errors) {
            errorMsg = "Validation failed. Please correct the fields marked in the form.";
            let detailedMsg = "Could not save record.\n\n";
            for (const [field, errors] of Object.entries(data.errors)) {
              detailedMsg += `${field.toUpperCase()}: ${errors.join(", ")}\n`;
            }
            const errorDiv = document.getElementById("formErrorMessage");
            if (errorDiv) {
              errorDiv.textContent = detailedMsg;
              errorDiv.classList.remove("hidden");
            }
          }
          
          if (typeof window.showErrorModal === 'function') {
            window.showErrorModal(errorMsg);
          } else {
            alert(errorMsg);
          }
        }
      })
      .catch(err => {
        console.error("AJAX Error:", err);
        saveRecordBtn.textContent = prevText;
        saveRecordBtn.disabled = false;
        
        const networkError = "Network error. Please check your connection and try again.";
        const errorDiv = document.getElementById("formErrorMessage");
        if (errorDiv) {
          errorDiv.textContent = networkError;
          errorDiv.classList.remove("hidden");
        }
        
        if (typeof window.showErrorModal === 'function') {
          window.showErrorModal(networkError);
        } else {
          alert(networkError);
        }
      });
    });
  }
  // Delete Record AJAX Action
  const deleteRecordBtn = document.getElementById("deleteRecordBtn");
  const deleteConfirmModalOverlay = document.getElementById("deleteConfirmModalOverlay");
  const deleteConfirmModalCard = document.getElementById("deleteConfirmModalCard");
  const cancelDeleteActionBtn = document.getElementById("cancelDeleteActionBtn");
  const confirmDeleteActionBtn = document.getElementById("confirmDeleteActionBtn");

  let deleteTargetItemId = null;
  let deleteTargetBtn = null;

  function closeDeleteConfirmModal() {
    if (deleteConfirmModalOverlay && deleteConfirmModalCard) {
      deleteConfirmModalOverlay.classList.add("opacity-0");
      deleteConfirmModalCard.classList.remove("scale-100", "opacity-100");
      deleteConfirmModalCard.classList.add("scale-95", "opacity-0");
      
      setTimeout(() => {
        deleteConfirmModalOverlay.classList.add("hidden", "pointer-events-none");
        deleteConfirmModalOverlay.style.display = "none";
      }, 300);
    }
  }

  if (cancelDeleteActionBtn) cancelDeleteActionBtn.addEventListener("click", closeDeleteConfirmModal);

  if (deleteRecordBtn && inventoryForm) {
    deleteRecordBtn.addEventListener("click", () => {
      const formData = new FormData(inventoryForm);
      const itemId = formData.get("id");
      
      if (itemId && isEditing) {
        deleteTargetItemId = itemId;
        deleteTargetBtn = deleteRecordBtn;
        
        // Open the custom CSS modal instead of native confirm
        if (deleteConfirmModalOverlay && deleteConfirmModalCard) {
          deleteConfirmModalOverlay.style.display = "flex";
          deleteConfirmModalOverlay.classList.remove("hidden", "pointer-events-none");
          void deleteConfirmModalOverlay.offsetWidth;
          deleteConfirmModalOverlay.classList.remove("opacity-0");
          
          deleteConfirmModalCard.classList.remove("scale-95", "opacity-0");
          deleteConfirmModalCard.classList.add("scale-100", "opacity-100");
        } else {
          // Fallback if modal is missing
          if (confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
             executeDeleteRequest(itemId, deleteRecordBtn);
          }
        }
      }
    });

    if (confirmDeleteActionBtn) {
      confirmDeleteActionBtn.addEventListener("click", () => {
        closeDeleteConfirmModal();
        if (deleteTargetItemId && deleteTargetBtn) {
          executeDeleteRequest(deleteTargetItemId, deleteTargetBtn);
        }
      });
    }

    function executeDeleteRequest(itemId, btnRef) {
      const url = `/inventory/${itemId}/delete/`;
      const prevText = btnRef.textContent;
      btnRef.textContent = "Deleting...";
      btnRef.disabled = true;

      fetch(url, {
        method: "POST",
        headers: {
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json"
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          closeDrawer();
          localStorage.setItem("showSuccessModalFlag", "deleted");
          window.location.href = "/activity-log/";
        } else {
          btnRef.textContent = prevText;
          btnRef.disabled = false;
          if (typeof window.showErrorModal === 'function') {
            window.showErrorModal(data.message || "Could not delete the record.");
          } else {
            alert(data.message || "Could not delete the record.");
          }
        }
      })
      .catch(err => {
        console.error("AJAX Error:", err);
        btnRef.textContent = prevText;
        btnRef.disabled = false;
        
        const networkError = "Network error while attempting to delete. Please try again.";
        if (typeof window.showErrorModal === 'function') {
          window.showErrorModal(networkError);
        } else {
          alert(networkError);
        }
      });
    }
  }

  // --- Borrow Modal Controller ---
  const borrowModalOverlay = document.getElementById('borrowModalOverlay');
  const borrowModalCard = document.getElementById('borrowModalCard');
  const borrowRecordBtn = document.getElementById('borrowRecordBtn');
  const cancelBorrowBtn = document.getElementById('cancelBorrowBtn');
  const borrowForm = document.getElementById('borrowForm');
  const borrowFormError = document.getElementById('borrowFormError');
  const borrowModalItemName = document.getElementById('borrowModalItemName');

  function openBorrowModal() {
    if (!borrowModalOverlay || !borrowModalCard) return;
    // Pre-fill inventory id and item name from the open drawer
    const formId = document.getElementById('form_id')?.value;
    const itemType = document.getElementById('form_item_type')?.value || '';
    const availQty = parseInt(document.getElementById('form_quantity')?.value || '1', 10);

    document.getElementById('borrow_inventory_id').value = formId;
    if (borrowModalItemName) borrowModalItemName.textContent = itemType;
    const qtyInput = document.getElementById('borrow_quantity');
    if (qtyInput) { qtyInput.max = availQty; qtyInput.value = 1; }

    // Clear form fields
    if (borrowForm) {
      document.getElementById('borrow_borrower_name').value = '';
      document.getElementById('borrow_office_location').value = '';
      document.getElementById('borrow_tel_no').value = '';
      document.getElementById('borrow_purpose').value = '';
      document.getElementById('borrow_expected_return').value = '';
    }
    if (borrowFormError) { borrowFormError.classList.add('hidden'); borrowFormError.textContent = ''; }

    borrowModalOverlay.style.display = 'flex';
    borrowModalOverlay.classList.remove('hidden', 'pointer-events-none');
    void borrowModalOverlay.offsetWidth;
    borrowModalOverlay.classList.remove('opacity-0');
    borrowModalCard.classList.remove('scale-95', 'opacity-0');
    borrowModalCard.classList.add('scale-100', 'opacity-100');
  }

  function closeBorrowModal() {
    if (!borrowModalOverlay || !borrowModalCard) return;
    borrowModalOverlay.classList.add('opacity-0');
    borrowModalCard.classList.remove('scale-100', 'opacity-100');
    borrowModalCard.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      borrowModalOverlay.classList.add('hidden', 'pointer-events-none');
      borrowModalOverlay.style.display = 'none';
    }, 300);
  }

  if (borrowRecordBtn) borrowRecordBtn.addEventListener('click', openBorrowModal);
  if (cancelBorrowBtn) cancelBorrowBtn.addEventListener('click', closeBorrowModal);
  if (borrowModalOverlay) borrowModalOverlay.addEventListener('click', function(e) {
    if (e.target === borrowModalOverlay) closeBorrowModal();
  });

  if (borrowForm) {
    borrowForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBorrowBtn');
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

      const payload = {
        inventory_id: document.getElementById('borrow_inventory_id').value,
        borrower_name: document.getElementById('borrow_borrower_name').value.trim(),
        office_location: document.getElementById('borrow_office_location').value.trim(),
        tel_no: document.getElementById('borrow_tel_no').value.trim(),
        purpose: document.getElementById('borrow_purpose').value.trim(),
        expected_return: document.getElementById('borrow_expected_return').value,
        quantity_borrowed: parseInt(document.getElementById('borrow_quantity').value || '1', 10),
      };

      if (!payload.borrower_name || !payload.office_location || !payload.expected_return || !payload.tel_no || !payload.purpose) {
        if (borrowFormError) {
          borrowFormError.textContent = 'Please fill in all required fields.';
          borrowFormError.classList.remove('hidden');
        }
        return;
      }

      const qtyInput = document.getElementById('borrow_quantity');
      const maxQty = parseInt(qtyInput.getAttribute('max') || '0', 10);
      if (payload.quantity_borrowed > maxQty) {
        if (typeof window.showErrorModal === 'function') {
          window.showErrorModal(`Only ${maxQty} unit(s) available.`);
        } else if (borrowFormError) {
          borrowFormError.textContent = `Only ${maxQty} unit(s) available.`;
          borrowFormError.classList.remove('hidden');
        }
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Issuing...'; }

      fetch('/borrowing/issue/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(payload),
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          closeBorrowModal();
          closeDrawer();
          localStorage.setItem('showSuccessModalFlag', 'borrowed');
          window.location.reload();
        } else {
          if (typeof window.showErrorModal === 'function') {
            window.showErrorModal(data.error || 'Could not issue item.');
          } else if (borrowFormError) {
            borrowFormError.textContent = data.error || 'Could not issue item.';
            borrowFormError.classList.remove('hidden');
          }
        }
      })
      .catch(() => {
        if (borrowFormError) {
          borrowFormError.textContent = 'Network error. Please try again.';
          borrowFormError.classList.remove('hidden');
        }
      })
      .finally(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Issue'; }
      });
    });
  }
});
