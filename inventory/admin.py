from django.contrib import admin
from .models import Inventory, AuditLog, IssuanceLog
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('item_type', 'brand', 'model', 'serial_number', 'location', 'status')
    list_filter = ('status', 'location', 'item_type')
    search_fields = ('item_type', 'brand', 'serial_number')
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('item_type', 'action', 'performed_by', 'timestamp')
    list_filter = ('action', 'performed_by')
    search_fields = ('item_type', 'performed_by', 'description')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
@admin.register(IssuanceLog)
class IssuanceLogAdmin(admin.ModelAdmin):
    list_display = ('inventory_item', 'borrower_name', 'status', 'date_issued', 'expected_return', 'issued_by')
    list_filter = ('status', 'office_location')
    search_fields = ('borrower_name', 'issued_by')
    readonly_fields = ('date_issued',)