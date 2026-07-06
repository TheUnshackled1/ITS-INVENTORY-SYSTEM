from django.db import models

from django.db import models


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
    model = models.CharField(max_length=100)

    serial_number = models.CharField(
        max_length=100,
        unique=True
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