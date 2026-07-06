from django.shortcuts import redirect, render
from django.contrib import messages

from .forms import InventoryForm
from .models import Inventory


def inventory_list(request):
    inventory_items = Inventory.objects.all().order_by('item_type', 'serial_number')
    return render(
        request,
        'inventory.html',
        {
            'inventory_items': inventory_items,
        },
    )


def add_inventory(request):
    if request.method == 'POST':
        form = InventoryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('inventory-list')
    else:
        form = InventoryForm()

    return render(
        request,
        'add_inventory.html',
        {
            'form': form,
        },
    )

def upload_excel(request):
    if request.method == 'POST':
        excel_file = request.FILES.get('excel_file')
        
        if excel_file:
            try:             
                messages.success(request, "Inventory updated successfully!")
            except Exception as e:
                messages.error(request, f"Error processing file: {e}")
                
        return redirect('inventory-list')
    return redirect('inventory-list')