document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    
    // Return modal elements
    const returnOverlay = document.getElementById('returnConfirmModalOverlay');
    const returnCard = document.getElementById('returnConfirmModalCard');
    const returnText = document.getElementById('returnConfirmText');
    const returnIdInput = document.getElementById('returnIssuanceId');
    const cancelReturnBtn = document.getElementById('cancelReturnBtn');
    const confirmReturnBtn = document.getElementById('confirmReturnBtn');

    function openReturnModal(id, borrower, item, qty) {
      returnIdInput.value = id;
      returnText.textContent = `Return ${qty}x "${item}" from ${borrower}?`;
      returnOverlay.style.display = 'flex';
      requestAnimationFrame(() => {
        returnOverlay.classList.remove('opacity-0', 'pointer-events-none');
        returnCard.classList.remove('scale-95', 'opacity-0');
        returnCard.classList.add('scale-100', 'opacity-100');
      });
    }

    function closeReturnModal() {
      returnOverlay.classList.add('opacity-0', 'pointer-events-none');
      returnCard.classList.remove('scale-100', 'opacity-100');
      returnCard.classList.add('scale-95', 'opacity-0');
      setTimeout(() => { returnOverlay.style.display = 'none'; }, 300);
    }

    if (cancelReturnBtn) cancelReturnBtn.addEventListener('click', closeReturnModal);
    if (returnOverlay) returnOverlay.addEventListener('click', function(e) {
      if (e.target === returnOverlay) closeReturnModal();
    });

    // Attach return buttons
    document.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        openReturnModal(
          this.dataset.id,
          this.dataset.borrower,
          this.dataset.item,
          this.dataset.qty
        );
      });
    });

    // Confirm return
    if (confirmReturnBtn) {
      confirmReturnBtn.addEventListener('click', function() {
        const id = returnIdInput.value;
        const notes = '';
        confirmReturnBtn.disabled = true;
        confirmReturnBtn.textContent = 'Returning...';

        fetch(`/borrowing/${id}/return/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({ notes: notes }),
        })
        .then(r => r.json())
        .then(data => {
          closeReturnModal();
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
          closeReturnModal();
          if (typeof window.showErrorModal === 'function') {
            window.showErrorModal('Network error. Please try again.');
          }
        })
        .finally(() => {
          confirmReturnBtn.disabled = false;
          confirmReturnBtn.textContent = 'Return';
        });
      });
    }

    // Initialize SimpleDatatables
    const tableEl = document.getElementById('borrowing-table');
    if (tableEl && window.simpleDatatables) {
      new window.simpleDatatables.DataTable(tableEl, {
        searchable: false,
        perPage: 15,
        perPageSelect: [10, 15, 20, 50, 100],
        sortable: true
      });
    }
  });
