from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from inventory import views
from inventory.views import add_inventory, edit_inventory, inventory_list, CustomLoginView, activity_log, dashboard_view

admin.site.site_header = "MIS Inventory Admin"
admin.site.site_title = "MIS Inventory Portal"
admin.site.index_title = "Welcome to the MIS Inventory Django Built-in Dashboard"

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('inventory/', inventory_list, name='inventory-list'),
    path('inventory/add/', add_inventory, name='inventory-create'),
    path('inventory/<int:pk>/edit/', edit_inventory, name='inventory-edit'),
    path('inventory/<int:pk>/delete/', views.delete_inventory, name='inventory-delete'),
    path('admin/', admin.site.urls),
    path('upload/', views.upload_excel, name='inventory-upload'),
    path('login/', CustomLoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('activity-log/', activity_log, name='activity-log'),
    path('borrowing/', views.borrowing_list, name='borrowing-list'),
    path('borrowing/issue/', views.borrow_item, name='borrowing-issue'),
    path('borrowing/<int:pk>/return/', views.return_item, name='borrowing-return'),
]