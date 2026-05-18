import pandas as pd
import json
import math

# Read the Excel file
xlsx = pd.ExcelFile('/workspace/user_input_files/PC.xlsx')
df = pd.read_excel(xlsx, sheet_name='Лист1', header=None)

# Convert to list of lists, replacing NaN with null
data = []
for row in df.values.tolist():
    cleaned_row = []
    for val in row:
        if isinstance(val, float) and math.isnan(val):
            cleaned_row.append(None)
        else:
            cleaned_row.append(val)
    data.append(cleaned_row)

# Save as JSON
with open('/workspace/blending-calculator/src/data/recipes.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Exported {len(data)} rows to recipes.json")
print(f"Header: {data[0]}")