from django.contrib import admin
from django.urls import path

from inventory import views
from inventory.views import add_inventory, edit_inventory, inventory_list

urlpatterns = [
    path('', inventory_list, name='inventory-list'),
    path('inventory/add/', add_inventory, name='inventory-create'),
    path('inventory/<int:pk>/edit/', edit_inventory, name='inventory-edit'),
    path('admin/', admin.site.urls),
    path('upload/', views.upload_excel, name='inventory-upload'),
]
