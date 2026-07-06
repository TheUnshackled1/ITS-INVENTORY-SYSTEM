from django.shortcuts import redirect, render

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
