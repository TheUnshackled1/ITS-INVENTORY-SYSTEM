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
    // Load preference from localStorage
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

  // Existing DataTable Logic
  if (document.getElementById("inventory-table") && window.simpleDatatables) {
    const table = new window.simpleDatatables.DataTable("#inventory-table", {
      searchable: false,
      fixedHeight: false,
      perPageSelect: [10, 20, 50, 100],
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
        table.search(e.target.value);
      });
    }
  }
});
