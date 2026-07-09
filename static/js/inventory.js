
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
        window.showSuccessModal(successMessage);
      }
    }, 150);
  }

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

        bottomBar.innerHTML = `
          <div class="datatable-info">Showing ${start} to ${end} of ${totalRows} entries</div>
          <nav class="datatable-pagination">
            <ul class="datatable-pagination-list">
              <li class="datatable-pagination-list-item ${currentPage === 1 ? "datatable-disabled" : ""}">
                <button data-page="${currentPage - 1}" class="datatable-pagination-list-item-link">&lsaquo; Previous</button>
              </li>
              ${Array.from({length: totalPages}, (_, i) => `
                <li class="datatable-pagination-list-item ${i + 1 === currentPage ? "datatable-active" : ""}">
                  <button data-page="${i + 1}" class="datatable-pagination-list-item-link">${i + 1}</button>
                </li>
              `).join("")}
              <li class="datatable-pagination-list-item ${currentPage === totalPages || totalPages === 0 ? "datatable-disabled" : ""}">
                <button data-page="${currentPage + 1}" class="datatable-pagination-list-item-link">Next &rsaquo;</button>
              </li>
            </ul>
          </nav>`;

        bottomBar.querySelectorAll("button[data-page]").forEach(btn => {
          btn.addEventListener("click", function () {
            const page = parseInt(this.dataset.page);
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            renderPage();
            tableEl.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
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

  // --- Log Detail Modal Controller ---
  const logDetailModalOverlay = document.getElementById("logDetailModalOverlay");
  const logDetailModalCard = document.getElementById("logDetailModalCard");
  const logDetailItemType = document.getElementById("logDetailItemType");
  const logDetailSummary = document.getElementById("logDetailSummary");
  const logDetailModalCloseBtn = document.getElementById("logDetailModalCloseBtn");

  const openLogDetailModal = function(itemType, summary, detailsJSON) {
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
            logDetailModalCard.classList.remove("max-w-md");
            logDetailModalCard.classList.add("max-w-xl");
          }
          
          let beforeHtml = '<div class="grid grid-cols-2 gap-x-2 gap-y-4 text-left w-full">';
          for (const [k, v] of Object.entries(detailObj.before)) {
            if (k.startsWith('_')) continue;
            beforeHtml += `
              <div class="col-span-1 flex flex-col">
                <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">${k}</span>
                <span class="text-xs font-semibold text-slate-800 break-words">${v}</span>
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
            logDetailModalCard.classList.remove("max-w-4xl");
            logDetailModalCard.classList.add("max-w-md");
          }
          
          html += '<div class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5 text-left w-full mt-2 border-b border-slate-100 pb-4 mb-4">';
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
        
        if (data.success && data.item) {
          closeDrawer();
          
          // Queue the animated success modal for after the native page reload completes
          localStorage.setItem("showSuccessModalFlag", isEditing ? "edited" : "added");
          
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
          if (borrowFormError) {
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
