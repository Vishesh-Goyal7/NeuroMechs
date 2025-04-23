import pandas as pd

file_path = '/Users/visheshgoyal/NeuroMechs/CleansedDataset/Dataset3.csv'
df = pd.read_csv(file_path)

disease_column = df.columns[0]
symptom_columns = df.columns[1:]

feature_map = df.groupby(disease_column)[symptom_columns].mean().reset_index()
feature_map[symptom_columns] = feature_map[symptom_columns].applymap(lambda x: round(x, 5))

feature_map.to_csv('/Users/visheshgoyal/NeuroMechs/CleansedDataset/symptomMap.csv', index=False)

print("✅ Symptom weightage feature map saved!")
