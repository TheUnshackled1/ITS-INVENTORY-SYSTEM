from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views

from inventory import views
from inventory.views import add_inventory, edit_inventory, inventory_list, CustomLoginView

urlpatterns = [
    path('', inventory_list, name='inventory-list'),
    path('inventory/add/', add_inventory, name='inventory-create'),
    path('inventory/<int:pk>/edit/', edit_inventory, name='inventory-edit'),
    path('admin/', admin.site.urls),
    path('upload/', views.upload_excel, name='inventory-upload'),
    path('login/', CustomLoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]