document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("#inventory-table");
  let dataTable;

  if (table && window.simpleDatatables) {
    dataTable = new simpleDatatables.DataTable(table, {
      searchable: true,
      sortable: false,
      fixedHeight: true,
      perPage: 50,
      perPageSelect: false,
    });
  }
});
