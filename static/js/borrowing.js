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
        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            card.classList.remove('scale-95', 'opacity-0');
            card.classList.add('scale-100', 'opacity-100');
        });
    }

    function closeModal(overlay, card, cb) {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            overlay.style.display = 'none';
            if (cb) cb();
        }, 300);
    }

    // ─── Step 1: open condition modal ─────────────────────────────────────────
    function openConditionModal(id, borrower, item, qty) {
        returnIdInput.value = id;
        // Pre-populate subtitle
        conditionSubtitle.textContent = `Return ${qty}x "${item}" from ${borrower}`;
        // Reset to defaults
        conditionStatus.value = 'available';
        conditionNotes.value  = '';
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
                btn.dataset.qty
            );
        }
    });

    // ─── Confirm Return: send to backend ─────────────────────────────────────
    if (confirmReturnBtn) {
        confirmReturnBtn.addEventListener('click', function() {
            const id             = returnIdInput.value;
            const returnStatus   = conditionStatus.value;
            const notes          = conditionNotes.value.trim();

            confirmReturnBtn.disabled     = true;
            confirmReturnBtn.textContent  = 'Returning...';

            fetch(`/borrowing/${id}/return/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ return_status: returnStatus, notes: notes }),
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
        new window.simpleDatatables.DataTable(tableEl, {
            searchable: false,
            perPage: 15,
            perPageSelect: [10, 15, 20, 50, 100],
            sortable: false
        });
    }
});
