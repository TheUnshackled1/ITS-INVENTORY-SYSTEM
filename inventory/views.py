from django.shortcuts import render

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
