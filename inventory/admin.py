from django.contrib import admin
from .models import Inventory, AuditLog


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

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
	list_display = (
		'action',
		'item_type',
		'performed_by',
		'timestamp',
	)
	list_filter = ('action', 'performed_by', 'timestamp')
	search_fields = ('item_type', 'performed_by', 'description')
	ordering = ('-timestamp',)
	readonly_fields = ('timestamp',)