import pandas as pd

# Read all sheets from the Excel file
xlsx = pd.ExcelFile('user_input_files/PC.xlsx')
print("Sheet names:", xlsx.sheet_names)
print("\n" + "="*80)

for sheet in xlsx.sheet_names:
    print(f"\n📋 Sheet: {sheet}")
    print("-"*80)
    df = pd.read_excel(xlsx, sheet_name=sheet, header=None)
    print(f"Shape: {df.shape}")
    print("\nFirst 40 rows:")
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_colwidth', 50)
    print(df.head(40).to_string())
    print("\n" + "="*80)