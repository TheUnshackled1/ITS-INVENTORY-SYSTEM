from django.contrib import admin
from .models import Inventory


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
	list_display = (
		'item_type',
		'brand',
		'model',
		'serial_number',
		'quantity',
		'location',
		'status',
		'date_inventory',
	)
	list_filter = ('status', 'location', 'brand', 'date_inventory')
	search_fields = ('item_type', 'brand', 'model', 'serial_number', 'location')
	ordering = ('item_type', 'serial_number')