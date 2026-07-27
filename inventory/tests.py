from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from inventory.models import Inventory, IssuanceLog

class InventoryModelTest(TestCase):
    def setUp(self):
        self.item = Inventory.objects.create(
            item_type="Laptop",
            item_description="Dell XPS 15",
            brand="Dell",
            model="XPS 15",
            serial_number="SN-12345",
            quantity=5,
            date_inventory=timezone.now().date(),
            location="Room 101",
            status="available"
        )

    def test_inventory_creation(self):
        self.assertEqual(str(self.item), "Laptop - SN-12345")
        self.assertEqual(self.item.status, "available")
        self.assertEqual(self.item.quantity, 5)

    def test_serial_number_empty_string_becomes_none(self):
        item2 = Inventory.objects.create(
            item_type="Monitor",
            item_description="LG 27 inch",
            brand="LG",
            serial_number="",
            quantity=2,
            date_inventory=timezone.now().date(),
            location="Room 102",
            status="available"
        )
        self.assertIsNone(item2.serial_number)

class BorrowingViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.client.login(username="testuser", password="password123")
        self.item = Inventory.objects.create(
            item_type="Projector",
            item_description="Epson HD",
            brand="Epson",
            serial_number="SN-9999",
            quantity=1,
            date_inventory=timezone.now().date(),
            location="Storage",
            status="available"
        )
        self.issuance = IssuanceLog.objects.create(
            inventory_item=self.item,
            quantity_borrowed=1,
            borrower_name="John Doe",
            office_location="MIS Office",
            purpose="Department Meeting",
            issued_by="testuser",
            date_issued=timezone.now().date(),
            expected_return=timezone.now().date() + timezone.timedelta(days=7),
            status="borrowed"
        )

    def test_borrowing_list_search_no_fielderror(self):
        # Search by query to verify Q filter doesn't throw FieldError for 'department'
        response = self.client.get(reverse('borrowing-list'), {'q': 'John'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "John Doe")

    def test_borrowing_list_search_by_purpose(self):
        response = self.client.get(reverse('borrowing-list'), {'q': 'Department Meeting'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Department Meeting")

class InventoryViewsRedirectTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="adminuser", password="password123")
        self.client.login(username="adminuser", password="password123")
        self.item = Inventory.objects.create(
            item_type="Keyboard",
            item_description="Mechanical Keyboard",
            brand="Logitech",
            serial_number="SN-KEY-1",
            quantity=10,
            date_inventory=timezone.now().date(),
            location="IT Room",
            status="available"
        )

    def test_add_inventory_direct_get_redirects(self):
        response = self.client.get(reverse('inventory-create'))
        self.assertRedirects(response, reverse('inventory-list'))

    def test_edit_inventory_direct_get_redirects(self):
        response = self.client.get(reverse('inventory-edit', kwargs={'pk': self.item.pk}))
        self.assertRedirects(response, reverse('inventory-list'))