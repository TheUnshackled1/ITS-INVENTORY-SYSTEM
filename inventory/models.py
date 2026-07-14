from django.db import models
from django.utils import timezone

class Inventory(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("in_use", "In Use"),
        ("repair", "Under Repair"),
        ("disposed", "Disposed"),
        ("lost", "Lost"),
    ]
    item_type = models.CharField(max_length=100)
    item_description = models.TextField()
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )
    quantity = models.PositiveIntegerField(default=1)
    date_inventory = models.DateField()
    date_disposal = models.DateField(
        blank=True,
        null=True
    )
    location = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available"
    )
    defect_description = models.TextField(
        blank=True,
        null=True
    )
    def __str__(self):
        return f"{self.item_type} - {self.serial_number}"
    def save(self, *args, **kwargs):
        if self.serial_number == "":
            self.serial_number = None
        super().save(*args, **kwargs)

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("added",   "Added"),
        ("edited",  "Edited"),
        ("deleted", "Deleted"),
        ("uploaded","Uploaded"),
        ("borrowed","Borrowed"),
        ("returned","Returned"),
    ]
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES)
    item_type   = models.CharField(max_length=100)
    item_id     = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    details     = models.TextField(blank=True, null=True)
    performed_by = models.CharField(max_length=150, default="System")
    timestamp   = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.action}] {self.item_type} by {self.performed_by}"


class IssuanceLog(models.Model):
    STATUS_CHOICES = [
        ("borrowed", "Borrowed"),
        ("returned", "Returned"),
        ("overdue",  "Overdue"),
    ]
    inventory_item = models.ForeignKey(
        Inventory, on_delete=models.SET_NULL,
        null=True, related_name="issuances"
    )
    quantity_borrowed = models.PositiveIntegerField(default=1)
    borrower_name = models.CharField(max_length=150)
    office_location = models.CharField(max_length=150)
    tel_no = models.CharField(max_length=30, blank=True, null=True)
    purpose = models.CharField(max_length=255, blank=True)
    issued_by = models.CharField(max_length=150)
    date_issued = models.DateField(default=timezone.now)
    expected_return = models.DateField()
    date_returned = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="borrowed"
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-date_issued"]

    def __str__(self):
        return f"Issued {self.quantity_borrowed}x to {self.borrower_name}"
