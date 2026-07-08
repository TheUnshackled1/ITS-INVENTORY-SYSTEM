// Tailwind CSS Configuration
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf8",
          100: "#d7f3ed",
          200: "#b0e6da",
          300: "#7fd4c1",
          400: "#47bfa5",
          500: "#219a83",
          600: "#177865",
          700: "#155f53",
          800: "#154d45",
          900: "#123f3a",
        },
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
};

// UI and DataTables Initialization
document.addEventListener("DOMContentLoaded", function () {
  // Check for pending success popups from native navigation
  const pendingSuccess = localStorage.getItem("showSuccessModalFlag");
  if (pendingSuccess) {
    localStorage.removeItem("showSuccessModalFlag");
    setTimeout(() => {
      if (typeof window.showSuccessModal === "function") {
        const successMessage = pendingSuccess === "edited"
          ? "Congratulations your record has been successfully edited"
          : "Congratulations your record has been successfully added";
        window.showSuccessModal(successMessage);
      }
    }, 150);
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
  let dataTable = null;
  const tableEl = document.getElementById("inventory-table");

  if (tableEl && window.simpleDatatables) {
    // Load ALL rows into DOM at once (no internal DT pagination)
    dataTable = new window.simpleDatatables.DataTable("#inventory-table", {
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
      inventoryForm.reset();
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
      }, 300);
    }
  };

  if (errorModalCloseBtn) errorModalCloseBtn.addEventListener("click", closeErrorModal);

  // Add Record Action
  const addModalHandler = () => {
    isEditing = false;
    inventoryForm.reset();
    document.getElementById("form_id").value = "";
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
      if (submitBtn) submitBtn.textContent = "Edit Record";
      
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
});
