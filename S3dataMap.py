import pandas as pd
from collections import Counter

file_path = '/Users/visheshgoyal/NeuroMechs/CleansedDataset/Dataset3.csv'
df = pd.read_csv(file_path)

disease_column = df.columns[0] 

disease_counts = Counter(df[disease_column])

output_path = 'disease_frequency_map.txt'
with open(output_path, 'w') as f:
    for disease, count in disease_counts.items():
        f.write(f"{disease}: {count}\n")

print(f"Disease frequency map saved to {output_path}")
