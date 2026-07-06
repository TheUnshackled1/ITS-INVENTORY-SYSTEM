import csv
import openpyxl
import warnings
from datetime import datetime
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from .forms import InventoryForm
from .models import Inventory


def get_row_value(row, index, default=""):
    if row is None or index >= len(row):
        return default

    value = row[index]
    return default if value is None else value


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


def edit_inventory(request, pk):
    inventory_item = get_object_or_404(Inventory, pk=pk)

    if request.method == 'POST':
        form = InventoryForm(request.POST, instance=inventory_item)
        if form.is_valid():
            form.save()
            return redirect('inventory-list')
    else:
        form = InventoryForm(instance=inventory_item)
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

                    for data in parsed_rows:
                        serial = data['serial_number']
                        
                        if serial:
                            if serial in seen_serials:
                                Inventory.objects.filter(serial_number=serial).update(
                                    item_type=data['item_type'],
                                    item_description=data['item_description'],
                                    brand=data['brand'],
                                    model=data['model'],
                                    quantity=data['quantity'],
                                    date_disposal=data['date_disposal'],
                                    date_inventory=data['date_inventory'],
                                    location=data['location'],
                                    status=data['status'],
                                    defect_description=data['defect_description']
                                )
                                continue
                            
                            seen_serials.add(serial)
                            
                            updated = Inventory.objects.filter(serial_number=serial).update(
                                item_type=data['item_type'],
                                item_description=data['item_description'],
                                brand=data['brand'],
                                model=data['model'],
                                quantity=data['quantity'],
                                date_disposal=data['date_disposal'],
                                date_inventory=data['date_inventory'],
                                location=data['location'],
                                status=data['status'],
                                defect_description=data['defect_description']
                            )
                            if not updated:
                                items_to_create.append(Inventory(**data))
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