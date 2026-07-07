from django import forms
from .models import Inventory


class InventoryForm(forms.ModelForm):
    class Meta:
        model = Inventory
        fields = [
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
        ]
        widgets = {
            'item_type': forms.TextInput(attrs={'class': 'form-input'}),
            'item_description': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 4}),
            'brand': forms.TextInput(attrs={'class': 'form-input'}),
            'model': forms.TextInput(attrs={'class': 'form-input'}),
            'serial_number': forms.TextInput(attrs={'class': 'form-input'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-input', 'min': 1}),
            'date_inventory': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'date_disposal': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'location': forms.TextInput(attrs={'class': 'form-input'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'defect_description': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
        }
