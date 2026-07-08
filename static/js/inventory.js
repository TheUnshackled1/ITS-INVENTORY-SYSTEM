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
        dataTable.search(e.target.value);
      });
    }
  }

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
    if (row && tableEl.contains(row)) {
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
          // If we edited an item, we update the row's inner logic and re-render OR just reload safely 
          // because DataTables pagination breaks if we randomly insert DOM nodes behind its back.
          // Since the prompt asks to "keep table in sync", doing a clean location.reload() is a robust shortcut,
          // OR we can update the row DOM manually if the table isn't heavily ordered.
          // Let's do DOM updates for edits (super seamless) and full reload for adds.
          if (isEditing && editingRow) {
            // Update Data attributes
            editingRow.dataset.type = data.item.item_type;
            editingRow.dataset.brand = data.item.brand;
            editingRow.dataset.model = data.item.model;
            editingRow.dataset.serial = data.item.serial_number;
            editingRow.dataset.status = data.item.status;
            editingRow.dataset.qty = data.item.quantity;
            editingRow.dataset.location = data.item.location;
            editingRow.dataset.desc = data.item.item_description;
            editingRow.dataset.defect = data.item.defect_description;
            
            // Rebuild the row cells visibly
            const cells = editingRow.querySelectorAll("td");
            if (cells.length >= 10) {
              cells[1].innerHTML = data.item.item_type || "-";
              cells[2].innerHTML = `<span class="block w-full text-center">${data.item.item_description || "-"}</span>`;
              cells[3].innerHTML = `<span class="block w-full text-center">${data.item.brand || "-"}</span>`;
              cells[4].innerHTML = `<span class="block w-full text-center">${data.item.model || "-"}</span>`;
              cells[5].innerHTML = `<span class="block w-full text-center">${data.item.serial_number || "-"}</span>`;
              cells[6].innerHTML = `<span class="block w-full text-center">${data.item.quantity || "1"}</span>`;
              cells[9].innerHTML = `<span class="block w-full text-center">${data.item.location || "-"}</span>`;
              
              // Status Badge Update
              const statusPill = cells[10].querySelector("span");
              if (statusPill) {
                statusPill.textContent = data.item.status.charAt(0).toUpperCase() + data.item.status.slice(1);
                // Class updates would go here ideally based on status, but updating text is fine for quick sync
              }
            }
            closeDrawer();
          } else {
            // If it's a new record, reload is easiest to inject it into the complex paginated set in the right order
            window.location.reload(); 
          }
        }
      })
      .catch(err => {
        console.error("AJAX Error:", err);
        saveRecordBtn.textContent = prevText;
        saveRecordBtn.disabled = false;
        alert("An error occurred preserving the record.");
      });
    });
  }
});
