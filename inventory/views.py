import csv
import openpyxl
import warnings
from datetime import datetime
from django.db.models import Q
from django.db.models.functions import Lower, Trim, Upper
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.http import JsonResponse
from .forms import InventoryForm
from .models import Inventory, AuditLog, IssuanceLog

import json

def log_action(request, action, item, extra="", old_item=None):
    who = request.user.username if hasattr(request, 'user') and request.user.is_authenticated else "System"
    pk_str = item.pk if item.pk else "New"
    
    def extract_details(obj):
        if not obj:
            return {}           
        display_location = obj.location or "-"
        if str(obj.status).lower().strip() == 'in_use':
            active_borrowings = IssuanceLog.objects.filter(
                inventory_item=obj, 
                status__in=['borrowed', 'overdue']
            )
            count = active_borrowings.count()
            if count == 1:
                display_location = active_borrowings.first().office_location or display_location
            elif count > 1:
                display_location = "Multiple Locations (In Use)"
        return {
            "Item Type": obj.item_type or "-",
            "Brand": obj.brand or "-",
            "Model": obj.model or "-",
            "Serial Number": obj.serial_number or "-",
            "Qty": obj.quantity or 1,
            "Inv Date": str(obj.date_inventory) if obj.date_inventory else "-",
            "Disp Date": str(obj.date_disposal) if obj.date_disposal else "-",
            "Location": display_location,
            "Status": str(obj.status).replace("_", " ").title() if obj.status else "-",
            "Defect": obj.defect_description or "-"
        }
    # Store full history so deleted/edited items preserve their exact state at that moment
    details = extract_details(item)
    
    if old_item and action in ["edited", "returned"]:
        details = {
            "before": extract_details(old_item),
            "after": details
        }
    # Make a friendly plain-text summary based on action
    if action == 'added':
        if "before" in details:
            qty = details["after"].get("Qty", 1)
        else:
            qty = details.get("Qty", 1)
        desc = f"Added {qty}x {item.item_type} (#{pk_str})"
    elif action == 'edited':
        desc = f"Edited {item.item_type} (#{pk_str})"
    elif action == 'deleted':
        desc = f"Deleted {item.item_type} (#{pk_str})"
    elif action == 'uploaded':
        desc = f"Uploaded {item.item_type}"
    else:
        desc = extra if extra else f"{action.capitalize()} {item.item_type} (#{pk_str})"        
    AuditLog.objects.create(
        action=action, item_type=item.item_type,
        item_id=item.pk, description=desc, details=json.dumps(details), performed_by=who
    )

class CustomLoginView(LoginView):
    def form_valid(self, form):
        messages.success(self.request, f"Welcome {form.get_user().username}", extra_tags="login_toast")
        return super().form_valid(form)

def get_row_value(row, index, default=""):
    if row is None or index >= len(row):
        return default
    value = row[index]
    return default if value is None else value

def normalize_text(value):
    if value is None:
        return ""
    return str(value).strip()

def build_query_url(request, **updates):
    query = request.GET.copy()
    for key, value in updates.items():
        if value in (None, ""):
            query.pop(key, None)
        else:
            query[key] = str(value)
    if query:
        return f"{request.path}?{query.urlencode()}"
    return request.path

def get_distinct_text_values(queryset, field_name, annotation_name):
    values = queryset.annotate(
        **{annotation_name: Trim(field_name)}
    ).values_list(annotation_name, flat=True).order_by(annotation_name)
    distinct_values = []
    seen = set()
    for value in values:
        cleaned_value = normalize_text(value)
        if not cleaned_value:
            continue
        key = cleaned_value.casefold()
        if key in seen:
            continue
        seen.add(key)
        distinct_values.append(cleaned_value)
    return distinct_values



@login_required
def dashboard_view(request):
    import json
    from django.db.models.functions import TruncDate
    from django.utils.timezone import now
    from datetime import timedelta
    from django.db.models import Count

    # Global KPI Calculations
    total_assets = Inventory.objects.count()
    total_issuances = IssuanceLog.objects.count()
    current_borrowings = IssuanceLog.objects.filter(status='borrowed').count()
    overdue_items = IssuanceLog.objects.filter(status='overdue').count()
    pending_repairs = Inventory.objects.filter(status='repair').count()

    def get_pct(part, total):
        if total == 0: return 0
        return round((part / total) * 100, 1)

    kpi = {
        'total_assets': total_assets,
        'current_borrowings': current_borrowings,
        'cb_pct': get_pct(current_borrowings, total_issuances),
        'overdue_items': overdue_items,
        'overdue_pct': get_pct(overdue_items, total_issuances),
        'pending_repairs': pending_repairs,
        'repair_pct': get_pct(pending_repairs, total_assets),
    }

    available_cnt = Inventory.objects.filter(status='available').count()
    repair_cnt = pending_repairs
    working_cnt = Inventory.objects.filter(status='working').count()
    not_working_cnt = Inventory.objects.filter(status='not_working').count()

    # Chart 1: Inventory Status Pie Chart payload
    pie_chart_data = {
        'labels': ['Available', 'Working', 'Under Repair', 'Not Working'],
        'data': [available_cnt, working_cnt, repair_cnt, not_working_cnt]
    }

    # Chart 2: Borrowing Trend (Last 7 Days)
    end_date = now().date()
    start_date = end_date - timedelta(days=6)
    
    # Generate continuous 7 days list to ensure zero-fill
    date_labels = [(start_date + timedelta(days=i)).strftime('%b %d') for i in range(7)]
    trend_dict = {label: 0 for label in date_labels}

    borrowing_trends = IssuanceLog.objects.filter(
        date_issued__gte=start_date,
        date_issued__lte=end_date
    ).values('date_issued').annotate(c=Count('id')).order_by('date_issued')

    for entry in borrowing_trends:
        label = entry['date_issued'].strftime('%b %d')
        if label in trend_dict:
            trend_dict[label] = entry['c']

    trend_chart_data = {
        'labels': date_labels,
        'data': list(trend_dict.values())
    }

    recent_items = Inventory.objects.order_by('-id')[:10]
    recent_borrowings = IssuanceLog.objects.order_by('-date_issued', '-id')[:10]
    recent_activity = AuditLog.objects.order_by('-timestamp', '-id')[:10]

    return render(request, "dashboard.html", {
        "kpi": kpi,
        "pie_chart_json": pie_chart_data,
        "trend_chart_json": trend_chart_data,
        "recent_items": recent_items,
        "recent_borrowings": recent_borrowings,
        "recent_activity": recent_activity
    })

@login_required
def inventory_list(request):
    base_queryset = Inventory.objects.all().annotate(
        trimmed_item_type=Trim('item_type'),
        trimmed_location=Trim('location'),
        sort_item_type=Lower(Trim('item_type')),
        sort_item_description=Lower(Trim('item_description')),
        sort_brand=Lower(Trim('brand')),
        sort_model=Lower(Trim('model')),
        sort_serial_number=Lower(Trim('serial_number')),
        sort_location=Lower(Trim('location')),
        sort_status=Lower(Trim('status')),
        sort_defect_description=Lower(Trim('defect_description')),
    )
    status_filter = normalize_text(request.GET.get('status'))
    location_filter = normalize_text(request.GET.get('location'))
    item_type_filter = normalize_text(request.GET.get('item_type'))
    search_query = normalize_text(request.GET.get('q'))
    sort_field = normalize_text(request.GET.get('sort'))
    sort_direction = normalize_text(request.GET.get('dir')).lower()
    inventory_items = base_queryset
    if status_filter:
        inventory_items = inventory_items.filter(status=status_filter)
    if location_filter:
        inventory_items = inventory_items.filter(trimmed_location=location_filter)
    if item_type_filter:
        inventory_items = inventory_items.filter(trimmed_item_type=item_type_filter)
    if search_query:
        inventory_items = inventory_items.filter(
            Q(item_type__icontains=search_query) |
            Q(item_description__icontains=search_query) |
            Q(brand__icontains=search_query) |
            Q(model__icontains=search_query) |
            Q(serial_number__icontains=search_query) |
            Q(location__icontains=search_query)
        )
    sort_field_map = {
        'no': 'pk',
        'item_type': 'sort_item_type',
        'item_description': 'sort_item_description',
        'brand': 'sort_brand',
        'model': 'sort_model',
        'serial_number': 'sort_serial_number',
        'quantity': 'quantity',
        'date_inventory': 'date_inventory',
        'date_disposal': 'date_disposal',
        'location': 'sort_location',
        'status': 'sort_status',
        'defect_description': 'sort_defect_description',
    }
    current_sort = sort_field if sort_field in sort_field_map else ''
    current_direction = 'desc' if sort_direction == 'desc' else 'asc'
    if current_sort:
        order_field = sort_field_map[current_sort]
        prefix = '-' if current_direction == 'desc' else ''
        inventory_items = inventory_items.order_by(f'{prefix}{order_field}', 'pk')
    else:
        inventory_items = inventory_items.order_by('sort_item_type', 'serial_number', 'pk')
    overall_qs = Inventory.objects.annotate(
        sort_item_type=Upper(Trim('item_type'))
    )
    overall_pks = overall_qs.order_by('sort_item_type', 'serial_number', 'pk').values_list('pk', flat=True)
    pk_to_no = {pk: i + 1 for i, pk in enumerate(overall_pks)}
    inventory_data = list(inventory_items.values(
        'pk', 'item_type', 'item_description', 'brand', 'model',
        'serial_number', 'quantity', 'date_inventory', 'date_disposal',
        'location', 'status', 'defect_description'
    ))
    for item in inventory_data:
        item['original_no'] = pk_to_no.get(item['pk'], '')
        # Keep raw ISO strings strictly for sorting/data-attributes
        item['date_inventory_raw'] = item['date_inventory'].strftime('%Y-%m-%d') if item['date_inventory'] else ''
        item['date_disposal_raw'] = item['date_disposal'].strftime('%Y-%m-%d') if item['date_disposal'] else ''       
        # Pre-format the UI display string safely circumventing local JS Date() clock drift
        item['date_inventory_ui'] = item['date_inventory'].strftime('%b %d, %Y') if item['date_inventory'] else '-'
        item['date_disposal_ui'] = item['date_disposal'].strftime('%b %d, %Y') if item['date_disposal'] else '-'
        # Serialize status display manually
        item['get_status_display'] = dict(Inventory.STATUS_CHOICES).get(item['status'], item['status'].replace("_", " ").title())   
    # Build active borrowings map for Context
    active_issuances = list(IssuanceLog.objects.filter(
        status__in=['borrowed', 'overdue'],
        inventory_item_id__in=[item['pk'] for item in inventory_data]
    ).values('inventory_item_id', 'borrower_name', 'office_location', 'quantity_borrowed', 'status'))   
    issuances_by_item = {}
    for log in active_issuances:
        pk = log['inventory_item_id']
        if pk not in issuances_by_item:
            issuances_by_item[pk] = []
        issuances_by_item[pk].append({
            'borrower_name': log['borrower_name'],
            'office_location': log['office_location'],
            'qty': log['quantity_borrowed'],
            'status': log['status']
        })       
    for item in inventory_data:
        item['active_borrowings'] = issuances_by_item.get(item['pk'], [])
    distinct_item_types = get_distinct_text_values(Inventory.objects.all(), 'item_type', 'trimmed_item_type')
    distinct_locations = get_distinct_text_values(Inventory.objects.all(), 'location', 'trimmed_location')
    distinct_status_values = [
        status_value
        for status_value, _ in Inventory.STATUS_CHOICES
        if Inventory.objects.filter(status=status_value).exists()
    ]
    status_label_map = dict(Inventory.STATUS_CHOICES)
    status_options = [
        {
            'value': status_value,
            'label': status_label_map.get(status_value, normalize_text(status_value).replace('_', ' ').title()),
        }
        for status_value in distinct_status_values
    ]
    sort_urls = {}
    for column_name in sort_field_map:
        next_direction = 'desc' if current_sort == column_name and current_direction == 'asc' else 'asc'
        sort_urls[column_name] = build_query_url(request, sort=column_name, dir=next_direction)
    total_items = Inventory.objects.count()
    available_count = Inventory.objects.filter(status='available').count()
    repair_count = Inventory.objects.filter(status='repair').count()
    in_use_count = Inventory.objects.filter(status='in_use').count()
    not_working_count = Inventory.objects.filter(
        defect_description__iregex=r'not working'
    ).count()
    def get_pct(part, total):
        return round((part / total) * 100, 1) if total > 0 else 0

    stats = {
        'total': total_items,
        'available': available_count,
        'available_pct': get_pct(available_count, total_items),
        'repair': repair_count,
        'repair_pct': get_pct(repair_count, total_items),
        'working': in_use_count,
        'working_pct': get_pct(in_use_count, total_items),
        'not_working': not_working_count,
        'not_working_pct': get_pct(not_working_count, total_items),
    }
    response = render(
        request,
        'inventory.html',
        {
            'inventory_data': inventory_data,
            'stats': stats,
            'distinct_item_types': distinct_item_types,
            'distinct_locations': distinct_locations,
            'status_options': status_options,
            'selected_status': status_filter,
            'selected_location': location_filter,
            'selected_item_type': item_type_filter,
            'search_query': search_query,
            'current_sort': current_sort,
            'current_direction': current_direction,
            'sort_urls': sort_urls,
            'has_inventory_records': Inventory.objects.exists(),
        },
    )
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

def serialize_inventory_item(item):
    data = {
        'id': item.id,
        'item_type': item.item_type or '',
        'item_description': item.item_description or '',
        'brand': item.brand or '',
        'model': item.model or '',
        'serial_number': item.serial_number or '',
        'quantity': item.quantity or 1,
        'date_inventory': str(item.date_inventory) if item.date_inventory else '',
        'date_disposal': str(item.date_disposal) if item.date_disposal else '',
        'location': item.location or '',
        'status': item.status or 'available',
        'defect_description': item.defect_description or '',
        'created_at': item.created_at.strftime('%b %d, %Y') if item.created_at else str(item.date_inventory) if item.date_inventory else '',
        'updated_at': item.updated_at.strftime('%b %d, %Y') if item.updated_at else '',
        'last_updated_by': item.last_updated_by or 'System',
    }   
    active_issuances = list(item.issuances.filter(status__in=['borrowed', 'overdue']).values(
        'borrower_name', 'office_location', 'quantity_borrowed', 'status'
    ))
    for log in active_issuances:
        log['qty'] = log.pop('quantity_borrowed')
        
    data['active_borrowings'] = active_issuances
    return data

@login_required
def add_inventory(request):
    if request.method == 'POST':
        form = InventoryForm(request.POST)
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json'
        if form.is_valid():
            item = form.save(commit=False)
            item.last_updated_by = request.user.first_name or request.user.username
            item.save()
            log_action(request, "added", item)
            if is_ajax:
                return JsonResponse({'success': True, 'item': serialize_inventory_item(item)})
            return redirect('inventory-list')
        elif is_ajax:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    else:
        form = InventoryForm()
    return render(
        request,
        'add_inventory.html',
        {
            'form': form,
        },
    )

@login_required
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
        # Create a fresh copy from db to represent old_item
        old_item = Inventory.objects.get(pk=pk)        
        form = InventoryForm(request.POST, instance=inventory_item)
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json'
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
            # Check for dummy edits
            def norm(v):
                return "" if v is None else str(v).strip()
            has_changes = False
            for field in optional_fields:
                if norm(getattr(old_item, field)) != norm(getattr(updated_item, field)):
                    has_changes = True
                    break            
            if not has_changes:
                if is_ajax:
                    return JsonResponse({'success': True, 'no_changes': True})
                return redirect('inventory-list')               
            updated_item.last_updated_by = request.user.first_name or request.user.username
            updated_item.save()
            log_action(request, "edited", updated_item, old_item=old_item)
            if is_ajax:
                return JsonResponse({'success': True, 'item': serialize_inventory_item(updated_item)})
            return redirect('inventory-list')
        elif is_ajax:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
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

@login_required
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
                        status_raw = str(get_row_value(row, 9, 'available')).lower().replace("-", " ").replace("_", " ").strip()
                        status = 'available'
                        if 'not working' in status_raw:
                            status = 'not_working'
                        elif 'working' in status_raw or 'available' in status_raw:
                            status = 'available'
                        elif 'use' in status_raw:
                            status = 'in_use'
                        elif 'defective' in status_raw or 'repair' in status_raw or 'defect' in status_raw:
                            status = 'repair'
                        elif 'disposed' in status_raw:
                            status = 'disposed'
                        elif 'lost' in status_raw:
                            status = 'lost'
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
                        status_raw = str(get_row_value(row, 9, 'available')).lower().replace("-", " ").replace("_", " ").strip()
                        status = 'available'
                        if 'not working' in status_raw:
                            status = 'not_working'
                        elif 'working' in status_raw or 'available' in status_raw:
                            status = 'available'
                        elif 'use' in status_raw:
                            status = 'in_use'
                        elif 'defective' in status_raw or 'repair' in status_raw or 'defect' in status_raw:
                            status = 'repair'
                        elif 'disposed' in status_raw:
                            status = 'disposed'
                        elif 'lost' in status_raw:
                            status = 'lost'
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
                    items_to_update = []
                    audit_logs = []                   
                    # Preemptively extract all existing instances into an in-memory dictionary
                    # to prevent sequential N+1 .filter().first() DB calls
                    serials_in_batch = [row['serial_number'] for row in parsed_rows if row['serial_number']]
                    existing_items_by_serial = {
                        item.serial_number: item 
                        for item in Inventory.objects.filter(serial_number__in=serials_in_batch)
                    }
                    # We also need to map items uniquely lacking serial numbers via compound tuple keys
                    blank_keys_in_batch = [
                        (
                            normalize_text(row['item_type']),
                            normalize_text(row['item_description']),
                            normalize_text(row['brand']),
                            normalize_text(row['model']),
                            row['date_inventory'],
                            row['date_disposal'],
                            normalize_text(row['location']),
                            row['status'],
                            normalize_text(row['defect_description']),
                        ) for row in parsed_rows if not row['serial_number']
                    ]                   
                    # In order to bulk-query compound fields efficiently, we iterate over a combined QuerySet.
                    # Since DB matching on 9 fields per element is complex to annotate, we fetch all non-serial items
                    # matching the basic characteristics of our batch and build an index in Python.
                    active_item_types = set(normalize_text(row['item_type']) for row in parsed_rows if not row['serial_number'])
                    existing_non_serial_items = Inventory.objects.filter(
                        Q(serial_number__isnull=True) | Q(serial_number=''),
                        item_type__in=active_item_types
                    )
                    existing_items_by_blank_key = {}
                    for item in existing_non_serial_items:
                        key = (
                            normalize_text(item.item_type),
                            normalize_text(item.item_description),
                            normalize_text(item.brand),
                            normalize_text(item.model),
                            item.date_inventory,
                            item.date_disposal,
                            normalize_text(item.location),
                            item.status,
                            normalize_text(item.defect_description),
                        )
                        existing_items_by_blank_key[key] = item
                    seen_serials = set()
                    seen_blank_keys = set()                    
                    update_fields = [
                        'item_type', 'item_description', 'brand', 'model', 
                        'serial_number', 'quantity', 'date_inventory',
                        'date_disposal', 'location', 'status', 'defect_description'
                    ]                   
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
                                existing_item = existing_items_by_serial.get(serial)
                                if existing_item:
                                    for field, value in data.items():
                                        setattr(existing_item, field, value)
                                    items_to_update.append(existing_item)
                                    audit_logs.append(AuditLog(
                                        action='edited',
                                        item_type=existing_item.item_type,
                                        item_id=existing_item.pk,
                                        description=f"Item {existing_item.item_type} edited.",
                                        details="Via Excel Upload",
                                        performed_by=request.user.username if request.user.is_authenticated else "System"
                                    ))
                                continue
                            seen_serials.add(serial)                            
                            existing_item = existing_items_by_serial.get(serial)
                            if existing_item:
                                for field, value in data.items():
                                    setattr(existing_item, field, value)
                                items_to_update.append(existing_item)
                                audit_logs.append(AuditLog(
                                    action='edited',
                                    item_type=existing_item.item_type,
                                    item_id=existing_item.pk,
                                    description=f"Item {existing_item.item_type} edited.",
                                    details="Via Excel Upload",
                                    performed_by=request.user.username if request.user.is_authenticated else "System"
                                ))
                            else:
                                new_item = Inventory(**data)
                                items_to_create.append(new_item)
                        else:
                            if blank_key in seen_blank_keys:
                                existing_item = existing_items_by_blank_key.get(blank_key)
                                if existing_item:
                                    for field, value in data.items():
                                        setattr(existing_item, field, value)
                                    items_to_update.append(existing_item)
                                    audit_logs.append(AuditLog(
                                        action='edited',
                                        item_type=existing_item.item_type,
                                        item_id=existing_item.pk,
                                        description=f"Item {existing_item.item_type} edited.",
                                        details="Via Excel Upload",
                                        performed_by=request.user.username if request.user.is_authenticated else "System"
                                    ))
                                continue
                            seen_blank_keys.add(blank_key)                            
                            existing_item = existing_items_by_blank_key.get(blank_key)
                            if existing_item:
                                for field, value in data.items():
                                    setattr(existing_item, field, value)
                                items_to_update.append(existing_item)
                                audit_logs.append(AuditLog(
                                    action='edited',
                                    item_type=existing_item.item_type,
                                    item_id=existing_item.pk,
                                    description=f"Item {existing_item.item_type} edited.",
                                    details="Via Excel Upload",
                                    performed_by=request.user.username if request.user.is_authenticated else "System"
                                ))
                            else:
                                new_item = Inventory(**data)
                                items_to_create.append(new_item)                               
                    if items_to_update:
                        # De-duplicate elements safely using their python memory internal ID proxy, 
                        # just in case sequential rows attempted to update the exact same PK multiple times.
                        unique_updates = {id(item): item for item in items_to_update}.values()
                        Inventory.objects.bulk_update(unique_updates, fields=update_fields)                       
                    if items_to_create:
                        inserted_items = Inventory.objects.bulk_create(items_to_create)
                        for item in inserted_items:
                            audit_logs.append(AuditLog(
                                action='uploaded',
                                item_type=item.item_type,
                                item_id=item.pk,
                                description=f"Item {item.item_type} uploaded.",
                                details="Via Excel Upload",
                                performed_by=request.user.username if request.user.is_authenticated else "System"
                            ))                      
                    if audit_logs:
                        AuditLog.objects.bulk_create(audit_logs)                        
                    # SYNCHRONIZE ISSUANCE LOGS FOR IN-USE ITEMS EXCEL UPLOADS
                    # Excel uploads lack Borrowing metadata but still insert `in_use` status constraints.
                    # Generate ghost metrics for any of the newly matched instances to correctly populate tracker
                    from datetime import timedelta                    
                    in_use_items = Inventory.objects.filter(status='in_use')
                    active_logs = IssuanceLog.objects.filter(status__in=['borrowed', 'overdue'])
                    items_with_logs = active_logs.values_list('inventory_item_id', flat=True)
                    missing_log_items = in_use_items.exclude(id__in=items_with_logs)                   
                    if missing_log_items.exists():
                        ghost_issuances = []
                        today_date = datetime.now().date()
                        whoami = request.user.username if request.user.is_authenticated else "System Migration"                        
                        for item in missing_log_items:
                            ghost_issuances.append(IssuanceLog(
                                inventory_item=item,
                                quantity_borrowed=item.quantity,
                                borrower_name="Imported Data",
                                office_location=item.location or "Unknown Office",
                                issued_by=whoami,
                                date_issued=item.date_inventory or today_date,
                                expected_return=item.date_inventory + timedelta(days=365) if item.date_inventory else today_date + timedelta(days=365),
                                status='borrowed',
                                notes="Automatically generated tracking log for Imported Data."
                            ))
                        if ghost_issuances:
                            IssuanceLog.objects.bulk_create(ghost_issuances)                           
                    messages.success(request, "Inventory updated successfully!")
                else:
                    messages.warning(request, "No valid data rows found in file.")
            except Exception as e:
                messages.error(request, f"Error processing file: {e}")             
        return redirect('inventory-list')
    return redirect('inventory-list')

@login_required(login_url='login')
def activity_log(request):
    import json
    from django.utils.timezone import localtime, now
    from datetime import timedelta
    search_query = request.GET.get('q', '').strip()
    date_filter = request.GET.get('date', '').strip()
    user_filter = request.GET.get('user', '').strip()
    module_filter = request.GET.get('module', '').strip()

    logs = AuditLog.objects.all().order_by('-timestamp')
    
    if search_query:
        logs = logs.filter(
            Q(item_type__icontains=search_query) |
            Q(performed_by__icontains=search_query) |
            Q(action__icontains=search_query)
        )
    
    if date_filter == 'today':
        logs = logs.filter(timestamp__date=now().date())
    elif date_filter == '7days':
        logs = logs.filter(timestamp__gte=now() - timedelta(days=7))
    elif date_filter == '30days':
        logs = logs.filter(timestamp__gte=now() - timedelta(days=30))
        
    if user_filter:
        logs = logs.filter(performed_by__iexact=user_filter)
        
    if module_filter:
        logs = logs.filter(action__iexact=module_filter)
        
    distinct_users = get_distinct_text_values(AuditLog.objects.all(), 'performed_by', 'trimmed_user')
    distinct_modules = [m[0] for m in AuditLog.ACTION_CHOICES]
    logs_data = []
    for log in logs:
        # Convert timestamp to local timezone for UI display
        local_time = localtime(log.timestamp) if log.timestamp else None
        
        logs_data.append({
            'pk': log.pk,
            'description': log.description or '',
            'details': log.details or '',
            'item_type': log.item_type or '',
            'performed_by': log.performed_by or '',
            'action': log.action or '',
            'timestamp_ui': local_time.strftime('%b. %d, %Y, %I:%M %p').replace("AM", "a.m.").replace("PM", "p.m.") if local_time else '-'
        })
    def get_pct(part, total):
        if total == 0: return 0
        return round((part / total) * 100, 1)

    total_logs = len(logs_data)
    stats = {
        'total': total_logs,
        'added': sum(1 for log in logs_data if log['action'] == 'added'),
        'edited': sum(1 for log in logs_data if log['action'] == 'edited'),
        'deleted': sum(1 for log in logs_data if log['action'] == 'deleted'),
        'uploaded': sum(1 for log in logs_data if log['action'] == 'uploaded'),
        'borrowed': IssuanceLog.objects.count(),
        'returned': IssuanceLog.objects.filter(status='returned').count(),
    }
    
    stats.update({
        'added_pct': get_pct(stats['added'], total_logs),
        'edited_pct': get_pct(stats['edited'], total_logs),
        'deleted_pct': get_pct(stats['deleted'], total_logs),
        'uploaded_pct': get_pct(stats['uploaded'], total_logs),
        'borrowed_pct': get_pct(stats['borrowed'], total_logs),
        'returned_pct': get_pct(stats['returned'], total_logs),
    })
    return render(request, "activity_log.html", {
        "logs": logs,
        "logs_json": json.dumps(logs_data), 
        "search_query": search_query,
        "selected_date": date_filter,
        "selected_user": user_filter,
        "selected_module": module_filter,
        "distinct_users": distinct_users,
        "distinct_modules": distinct_modules,
        "stats": stats
    })

from django.views.decorators.http import require_POST
@require_POST
@login_required(login_url='login')
def delete_inventory(request, pk):
    item = get_object_or_404(Inventory, pk=pk)
    log_action(
        request=request,
        action='deleted',
        item=item,
        extra="Deleted via dashboard UI"
    )
    item.delete()
    return JsonResponse({'success': True, 'message': 'Record deleted successfully'})

@require_POST
@login_required(login_url='login')
def borrow_item(request):
    import json
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid request data.'}, status=400)

    inventory_id = data.get('inventory_id')
    borrower_name = normalize_text(data.get('borrower_name', ''))
    office_location = normalize_text(data.get('office_location', ''))
    tel_no = normalize_text(data.get('tel_no', ''))
    purpose = normalize_text(data.get('purpose', ''))
    expected_return = data.get('expected_return', '')
    try:
        qty = int(data.get('quantity_borrowed', 1))
    except (TypeError, ValueError):
        qty = 1
    if not borrower_name or not office_location or not expected_return or not tel_no or not purpose:
        return JsonResponse({'success': False, 'error': 'Please fill in all required fields.'}, status=400)
    if qty < 1:
        return JsonResponse({'success': False, 'error': 'Quantity must be at least 1.'}, status=400)

    item = Inventory.objects.filter(pk=inventory_id).first()
    if not item:
        return JsonResponse({'success': False, 'error': 'Inventory item not found.'}, status=404)
    if qty > item.quantity:
        return JsonResponse({'success': False, 'error': f'Only {item.quantity} unit(s) available.'}, status=400)
    # Decrement inventory quantity
    item.quantity -= qty
    if item.quantity == 0:
        item.status = 'in_use'
    item.save()
    # Parse expected return date
    try:
        expected_return_date = datetime.strptime(expected_return, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Invalid expected return date.'}, status=400)
    who = request.user.username if request.user.is_authenticated else 'System'
    issuance = IssuanceLog.objects.create(
        inventory_item=item,
        quantity_borrowed=qty,
        borrower_name=borrower_name,
        office_location=office_location,
        tel_no=tel_no or None,
        purpose=purpose,
        issued_by=who,
        expected_return=expected_return_date,
        status='borrowed',
    )
    desc = (
        f"Borrowed {qty}x {item.item_type} (#{item.pk}) "
        f"by {borrower_name} — "
        f"to {office_location}, due {expected_return_date}"
    )
    log_action(request, 'borrowed', item, extra=desc)
    return JsonResponse({
        'success': True,
        'new_qty': item.quantity,
        'new_status': item.status,
        'issuance_id': issuance.pk,
    })

@require_POST
@login_required(login_url='login')
def return_item(request, pk):
    import json
    issuance = get_object_or_404(IssuanceLog, pk=pk)

    if issuance.status == 'returned':
        return JsonResponse({'success': False, 'error': 'This item has already been returned.'}, status=400)
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        data = {}
    notes = normalize_text(data.get('notes', ''))
    # Determine the status the item returns to (staff-selected in the condition modal)
    valid_return_statuses = {'available', 'repair', 'disposed', 'lost'}
    return_status = normalize_text(data.get('return_status', 'available')).lower()
    today = datetime.now().date()
    issuance.date_returned = today
    issuance.status = 'returned'
    if notes:
        issuance.notes = notes
    issuance.save()
    item = issuance.inventory_item
    old_item = None
    if item:
        # Create a deep copy for Audit Logging comparison
        old_item = Inventory.objects.get(pk=item.pk)
        # Determine if we can safely merge back into the main inventory record pile
        same_status = (str(item.status).lower().strip() == return_status)
        same_defect = (normalize_text(item.defect_description) == notes)
        
        return_location = normalize_text(data.get('location', item.location))
        same_location = (normalize_text(item.location) == return_location)

        active_other_borrowings_count = IssuanceLog.objects.filter(
            inventory_item=item, 
            status__in=['borrowed', 'overdue']
        ).exclude(pk=issuance.pk).count()

        # Merge if the condition AND location are identical, OR if this returned unit is the absolute last unit
        # tied to the parent row (meaning there are no outstanding units left to corrupt).
        can_merge = (same_status and same_defect and same_location) or (item.quantity == 0 and active_other_borrowings_count == 0)

        if can_merge:
            item.quantity += issuance.quantity_borrowed
            item.status = return_status
            if not (same_status and same_defect and same_location):
                # If merging due to being the final unit, we must adopt the new properties.
                item.defect_description = notes
                item.location = return_location
            item.save()
        else:
            # We cannot merge because doing so would contaminate pristine units still in the stockroom!
            # We must SPLIT the return into its own pile.
            # First, check if a pile with this EXACT condition and model already exists to merge with instead.
            matching_pile = Inventory.objects.annotate(
                trimmed_item_type=Trim('item_type'),
                trimmed_item_description=Trim('item_description'),
                trimmed_brand=Trim('brand'),
                trimmed_model=Trim('model'),
                trimmed_location=Trim('location'),
                trimmed_defect_description=Trim('defect_description'),
            ).filter(
                Q(serial_number__isnull=True) | Q(serial_number=''),
                trimmed_item_type=normalize_text(item.item_type),
                trimmed_item_description=normalize_text(item.item_description),
                trimmed_brand=normalize_text(item.brand),
                trimmed_model=normalize_text(item.model),
                trimmed_location=return_location,
                date_inventory=item.date_inventory,
                status=return_status,
                trimmed_defect_description=notes
            ).first()

            if matching_pile:
                matching_pile.quantity += issuance.quantity_borrowed
                matching_pile.save()
                
                # Link this issuance to the existing matching pile
                issuance.inventory_item = matching_pile
                issuance.save()
                item = matching_pile
            else:
                # No existing pile found. We must spawn a brand new independent record clone.
                import uuid
                new_item = Inventory.objects.get(pk=item.pk)
                new_item.pk = None # Clones the row
                new_item.quantity = issuance.quantity_borrowed
                new_item.status = return_status
                new_item.defect_description = notes
                new_item.location = return_location
                new_item.serial_number = f"SPLIT-{uuid.uuid4().hex[:8].upper()}"
                new_item.save()
                # Link this issuance to the newly spawned broken pile
                issuance.inventory_item = new_item
                issuance.save()
                item = new_item
    who = request.user.username if request.user.is_authenticated else 'System'
    desc = (
        f"Returned {issuance.quantity_borrowed}x "
        f"{item.item_type if item else 'Unknown'} (#{item.pk if item else '?'}) "
        f"from {issuance.borrower_name}"
    )
    if item:
        log_action(request, 'returned', item, extra=desc, old_item=old_item)
    else:
        # Fallback if no item matched
        AuditLog.objects.create(
            action='returned',
            item_type='Unknown',
            description=desc,
            performed_by=who
        )
    return JsonResponse({'success': True, 'message': 'Item returned successfully.'})

@login_required
def borrowing_list(request):
    today = datetime.now().date()
    tab = request.GET.get('tab', 'all').strip().lower()
    search_query = request.GET.get('q', '').strip()
    # Mark overdue records in the database
    IssuanceLog.objects.filter(
        status='borrowed',
        expected_return__lt=today,
    ).update(status='overdue')
    logs = IssuanceLog.objects.select_related('inventory_item').all()
    if tab == 'borrowed':
        logs = logs.filter(status='borrowed')
    elif tab == 'returned':
        logs = logs.filter(status='returned')
    elif tab == 'overdue':
        logs = logs.filter(status='overdue')
    if search_query:
        logs = logs.filter(
            Q(borrower_name__icontains=search_query) |
            Q(department__icontains=search_query) |
            Q(office_location__icontains=search_query) |
            Q(issued_by__icontains=search_query)
        )
    total_issuances = IssuanceLog.objects.count()
    currently_borrowed = IssuanceLog.objects.filter(status='borrowed').count()
    returned_count = IssuanceLog.objects.filter(status='returned').count()
    overdue_count = IssuanceLog.objects.filter(status='overdue').count()
    def get_pct(part, total):
        if total == 0: return 0
        return round((part / total) * 100, 1)

    stats = {
        'total': total_issuances,
        'borrowed': currently_borrowed,
        'returned': returned_count,
        'overdue': overdue_count,
        'borrowed_pct': get_pct(currently_borrowed, total_issuances),
        'returned_pct': get_pct(returned_count, total_issuances),
        'overdue_pct': get_pct(overdue_count, total_issuances),
    }
    return render(request, 'borrowing.html', {
        'logs': logs,
        'stats': stats,
        'current_tab': tab,
        'search_query': search_query,
        'today': today,
    })
