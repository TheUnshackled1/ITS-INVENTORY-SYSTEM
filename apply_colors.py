import re

with open('templates/inventory.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    'text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-600',
    'text-blue-700',
    text
)

text = re.sub(
    r'(<label for=\"excel-upload-header\"[^>]*class=\"[^\"]*)bg-gradient-to-r from-indigo-600 to-blue-600([^>]* hover):from-indigo-700 hover:to-blue-700',
    r'\1bg-indigo-600\2:bg-indigo-700',
    text
)

text = re.sub(
    r'(<a href=\"{% url \'inventory-create\' %}\"[^>]*class=\"[^\"]*)bg-gradient-to-r from-indigo-600 to-blue-600([^>]* hover):from-indigo-700 hover:to-blue-700',
    r'\1bg-blue-600\2:bg-blue-700',
    text
)

with open('templates/inventory.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)