import csv
import openpyxl
import warnings
from datetime import datetime
from django.db.models import Q
from django.db.models.functions import Trim, Upper
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from .forms import InventoryForm
from .models import Inventory


def get_row_value(row, index, default=""):
    if row is None or index >= len(row):
        return default
    value = row[index]
    return default if value is None else value


def normalize_text(value):
    if value is None:
        return ""
    return str(value).strip()


def update_inventory_fields(item, data):
    for field_name, field_value in data.items():
        setattr(item, field_name, field_value)
    item.save()


def find_inventory_match(data):
    serial_number = data['serial_number']
    if serial_number:
        return Inventory.objects.filter(serial_number=serial_number).first()

    queryset = Inventory.objects.annotate(
        trimmed_item_type=Trim('item_type'),
        trimmed_item_description=Trim('item_description'),
        trimmed_brand=Trim('brand'),
        trimmed_model=Trim('model'),
        trimmed_location=Trim('location'),
        trimmed_defect_description=Trim('defect_description'),
    ).filter(
        Q(serial_number__isnull=True) | Q(serial_number=''),
        trimmed_item_type=normalize_text(data['item_type']),
        trimmed_item_description=normalize_text(data['item_description']),
        trimmed_brand=normalize_text(data['brand']),
        trimmed_model=normalize_text(data['model']),
        trimmed_location=normalize_text(data['location']),
        date_inventory=data['date_inventory'],
        status=data['status'],
    )

    if data['date_disposal'] is None:
        queryset = queryset.filter(date_disposal__isnull=True)
    else:
        queryset = queryset.filter(date_disposal=data['date_disposal'])

    defect_description = normalize_text(data['defect_description'])
    if defect_description:
        queryset = queryset.filter(trimmed_defect_description=defect_description)
    else:
        queryset = queryset.filter(
            Q(trimmed_defect_description='') | Q(trimmed_defect_description__isnull=True)
        )

    return queryset.first()
    
def inventory_list(request):
    inventory_items = Inventory.objects.all().order_by('item_type', 'serial_number')
    normalized_items = inventory_items.annotate(normalized_defect=Upper(Trim('defect_description')))  
    total_items = inventory_items.count()
    available_count = inventory_items.filter(status='available').count()
    repair_count = inventory_items.filter(status='repair').count()
    in_use_count = normalized_items.filter(normalized_defect='WORKING').count()
    not_working_count = normalized_items.filter(normalized_defect='NOT WORKING').count()
    
    stats = {
        'total': total_items,
        'available': available_count,
        'repair': repair_count,
        'working': in_use_count,
        'not_working': not_working_count,
    }
    response = render(
        request,
        'inventory.html',
        {
            'inventory_items': inventory_items,
            'stats': stats,
        },
    )
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

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

def edit_inventory(request, pk):
    inventory_item = get_object_or_404(Inventory, pk=pk)
    optional_fields = {
        'item_type',
        'item_description',
        'brand',
        'model',
        'serial_number',
        'quantity',
        'date_inventory',
        'date_disposal',
        'location',
        'status',
        'defect_description',
    }
    if request.method == 'POST':
        form = InventoryForm(request.POST, instance=inventory_item)
        for field_name in optional_fields:
            form.fields[field_name].required = False
        if form.is_valid():
            updated_item = form.save(commit=False)
            if not updated_item.item_type:
                updated_item.item_type = inventory_item.item_type
            if not updated_item.item_description:
                updated_item.item_description = inventory_item.item_description
            if not updated_item.brand:
                updated_item.brand = inventory_item.brand
            if not updated_item.model:
                updated_item.model = inventory_item.model
            if updated_item.serial_number in ('', None):
                updated_item.serial_number = inventory_item.serial_number
            if updated_item.quantity in ('', None):
                updated_item.quantity = inventory_item.quantity or 1
            if updated_item.date_inventory in ('', None):
                updated_item.date_inventory = inventory_item.date_inventory
            if updated_item.date_disposal == '':
                updated_item.date_disposal = inventory_item.date_disposal
            if not updated_item.location:
                updated_item.location = inventory_item.location
            if not updated_item.status:
                updated_item.status = inventory_item.status or 'available'
            if updated_item.defect_description in ('', None):
                updated_item.defect_description = inventory_item.defect_description
            updated_item.save()
            return redirect('inventory-list')
    else:
        form = InventoryForm(instance=inventory_item)
        for field_name in optional_fields:
            form.fields[field_name].required = False
    return render(
        request,
        'add_inventory.html',
        {
            'form': form,
            'inventory_item': inventory_item,
        },
    )
def parse_date(date_val):
    if not date_val:
        return None
    if isinstance(date_val, datetime):
        return date_val.date()
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(str(date_val).strip(), fmt).date()
        except ValueError:
            continue
    return None

def upload_excel(request):
    if request.method == 'POST':
        excel_file = request.FILES.get('excel_file')
        if excel_file:
            try:
                filename = excel_file.name.lower()
                parsed_rows = []
                if filename.endswith('.xls'):
                    messages.error(
                        request,
                        'Legacy .xls files are not supported. Please save the file as .xlsx and upload it again.',
                    )
                    return redirect('inventory-list')
                if not filename.endswith(('.xlsx', '.csv')):
                    messages.error(
                        request,
                        'Unsupported file type. Please upload an .xlsx or .csv file.',
                    )
                    return redirect('inventory-list')
                if filename.endswith('.xlsx'):
                    with warnings.catch_warnings():
                        warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")
                        wb = openpyxl.load_workbook(excel_file, data_only=True)
                    sheet = wb.active
                    for row in sheet.iter_rows(min_row=4, values_only=True):
                        item_type = get_row_value(row, 0, "")
                        if not row or not item_type:
                            continue
                        try:
                            qty_value = get_row_value(row, 5, 1)
                            qty = int(qty_value) if qty_value not in ("", None) else 1
                        except (TypeError, ValueError):
                            qty = 1
                        status_raw = str(get_row_value(row, 9, 'available')).lower().strip()
                        status = 'available'
                        if 'working' in status_raw or 'use' in status_raw or 'available' in status_raw:
                            status = 'available'
                        elif 'defective' in status_raw or 'repair' in status_raw or 'defect' in status_raw:
                            status = 'repair'
                        serial = str(get_row_value(row, 4, '')).strip()
                        if serial.lower() in ('none', 'n/a', '-', ''):
                            serial = None
                        parsed_rows.append({
                            'item_type': item_type,
                            'item_description': get_row_value(row, 1, "") or "",
                            'brand': get_row_value(row, 2, "") or "",
                            'model': get_row_value(row, 3, "") or "",
                            'serial_number': serial,
                            'quantity': qty,
                            'date_disposal': parse_date(get_row_value(row, 6, None)),
                            'date_inventory': parse_date(get_row_value(row, 7, None)) or datetime.now().date(),
                            'location': get_row_value(row, 8, "") or "",
                            'status': status,
                            'defect_description': get_row_value(row, 10, "") or ""
                        })
                elif filename.endswith('.csv'):
                    data = excel_file.read().decode('utf-8').splitlines()
                    reader = csv.reader(data)

                    for _ in range(3):
                        next(reader, None)

                    for row in reader:
                        item_type = get_row_value(row, 0, "")
                        if not row or not item_type:
                            continue
                        try:
                            qty_value = get_row_value(row, 5, 1)
                            qty = int(qty_value) if qty_value not in ("", None) else 1
                        except (TypeError, ValueError):
                            qty = 1
                        status_raw = str(get_row_value(row, 9, 'available')).lower().strip()
                        status = 'available'
                        if 'working' in status_raw or 'use' in status_raw or 'available' in status_raw:
                            status = 'available'
                        elif 'defective' in status_raw or 'repair' in status_raw or 'defect' in status_raw:
                            status = 'repair'
                        serial = str(get_row_value(row, 4, '')).strip()
                        if serial.lower() in ('none', 'n/a', '-', ''):
                            serial = None
                        parsed_rows.append({
                            'item_type': item_type,
                            'item_description': get_row_value(row, 1, ""),
                            'brand': get_row_value(row, 2, ""),
                            'model': get_row_value(row, 3, ""),
                            'serial_number': serial,
                            'quantity': qty,
                            'date_disposal': parse_date(get_row_value(row, 6, None)),
                            'date_inventory': parse_date(get_row_value(row, 7, None)) or datetime.now().date(),
                            'location': get_row_value(row, 8, ""),
                            'status': status,
                            'defect_description': get_row_value(row, 10, "")
                        })
                else:
                    messages.error(
                        request,
                        'Unsupported file type. Please upload an .xlsx or .csv file.',
                    )
                    return redirect('inventory-list')
                if parsed_rows:
                    items_to_create = []
                    seen_serials = set()
                    seen_blank_keys = set()
                    for data in parsed_rows:
                        serial = data['serial_number']
                        blank_key = (
                            normalize_text(data['item_type']),
                            normalize_text(data['item_description']),
                            normalize_text(data['brand']),
                            normalize_text(data['model']),
                            data['date_inventory'],
                            data['date_disposal'],
                            normalize_text(data['location']),
                            data['status'],
                            normalize_text(data['defect_description']),
                        )
                        
                        if serial:
                            if serial in seen_serials:
                                existing_item = Inventory.objects.filter(serial_number=serial).first()
                                if existing_item:
                                    update_inventory_fields(existing_item, data)
                                continue
                            seen_serials.add(serial)
                            existing_item = find_inventory_match(data)
                            if existing_item:
                                update_inventory_fields(existing_item, data)
                            else:
                                items_to_create.append(Inventory(**data))
                        else:
                            if blank_key in seen_blank_keys:
                                existing_item = find_inventory_match(data)
                                if existing_item:
                                    update_inventory_fields(existing_item, data)
                                continue
                            seen_blank_keys.add(blank_key)
                            existing_item = find_inventory_match(data)
                            if existing_item:
                                update_inventory_fields(existing_item, data)
                            else:
                                items_to_create.append(Inventory(**data))

                    if items_to_create:
                        Inventory.objects.bulk_create(items_to_create)
                    messages.success(request, "Inventory updated successfully!")
                else:
                    messages.warning(request, "No valid data rows found in file.")
            except Exception as e:
                messages.error(request, f"Error processing file: {e}")             
        return redirect('inventory-list')
    return redirect('inventory-list')