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
    dataTable = new window.simpleDatatables.DataTable("#inventory-table", {
      searchable: false,
      sortable: false,
      fixedHeight: false,
      perPageSelect: false,
      perPage: 50,
      labels: {
        placeholder: "Search items...",
        perPage: "entries per page",
        noRows: "No entries to found",
        info: "Showing {start} to {end} of {rows} entries",
      },
    });

    const customSearch = document.getElementById("filter-search");
    if (customSearch) {
      customSearch.addEventListener("keyup", function (e) {
        if (dataTable) dataTable.search(e.target.value);
      });
    }
  }

  // Auto-uppercase transform for all textual inputs (Modal + Search)
  const autoUpperInputs = document.querySelectorAll('input[type="text"], textarea, #filter-search');
  autoUpperInputs.forEach(input => {
    input.addEventListener("input", function () {
      if (typeof this.selectionStart === "number") {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(start, end);
      } else {
        this.value = this.value.toUpperCase();
      }
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

  // Add Action
  const addModalHandler = () => {
    isEditing = false;
    inventoryForm.reset();
    document.getElementById("form_id").value = "";
    openDrawer("Add Inventory Record");
  };

  if (openAddModalBtn) openAddModalBtn.addEventListener("click", addModalHandler);
  
  const openAddModalBtnTop = document.getElementById("openAddModalBtnTop");
  if (openAddModalBtnTop) openAddModalBtnTop.addEventListener("click", addModalHandler);

  // Edit Action (Event Delegation for Table Rows)
  document.addEventListener("click", function (e) {
    const row = e.target.closest(".inventory-row");
    if (row && row.closest("#inventory-table")) {
      isEditing = true;
      editingRow = row;
      
      document.getElementById("form_id").value = row.dataset.id || "";
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
      const itemId = formData.get("id");
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
          
          // Seamless Background Sync: Fetch updated HTML and rebuild DataTable
          fetch(window.location.href, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
          })
          .then(res => res.text())
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newTable = doc.querySelector("#inventory-table");
            const oldTable = document.getElementById("inventory-table");
            
            if (oldTable && newTable) {
              if (dataTable) {
                dataTable.destroy(); // Restores original DOM
              }
              
              const restoredOldTable = document.getElementById("inventory-table");
              if (restoredOldTable) {
                restoredOldTable.parentNode.replaceChild(newTable, restoredOldTable);
                
                // Reinitialize DataTable
                dataTable = new window.simpleDatatables.DataTable("#inventory-table", {
                  searchable: false,
                  sortable: false,
                  fixedHeight: false,
                  perPageSelect: false,
                  perPage: 50,
                  labels: {
                    placeholder: "Search items...",
                    perPage: "entries per page",
                    noRows: "No entries to found",
                    info: "Showing {start} to {end} of {rows} entries",
                  },
                });
                
                // Keep the search filter synced
                const activeSearch = document.getElementById("filter-search");
                if (activeSearch && activeSearch.value) {
                  dataTable.search(activeSearch.value);
                }
              }
            }
            
            // Show Success Modal after seamless reload completes (+ timeout for drawer close)
            setTimeout(() => {
              if (typeof window.showSuccessModal === "function") {
                window.showSuccessModal();
              }
            }, 300);
          });
        } else {
          // Display validation errors!
          let errorMsg = "Could not save record.\n\n";
          if (data.errors) {
            for (const [field, errors] of Object.entries(data.errors)) {
              errorMsg += `${field.toUpperCase()}: ${errors.join(", ")}\n`;
            }
          }
          
          const errorDiv = document.getElementById("formErrorMessage");
          if (errorDiv) {
            errorDiv.textContent = errorMsg;
            errorDiv.classList.remove("hidden");
          } else {
            alert(errorMsg);
          }
        }
      })
      .catch(err => {
        console.error("AJAX Error:", err);
        saveRecordBtn.textContent = prevText;
        saveRecordBtn.disabled = false;
        
        const errorDiv = document.getElementById("formErrorMessage");
        if (errorDiv) {
          errorDiv.textContent = "An error occurred preserving the record. Please check your network connection.";
          errorDiv.classList.remove("hidden");
        } else {
          alert("An error occurred preserving the record.");
        }
      });
    });
  }
});
