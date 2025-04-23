import pandas as pd

df = pd.read_csv('/Users/visheshgoyal/NeuroMechs/OriginalDS/Final_Augmented_dataset_Diseases_and_Symptoms.csv', index_col=0)

df.columns = [col.strip().replace(' ', '_') for col in df.columns]

df.index = [idx.strip().replace(' ', '_') for idx in df.index]

df.to_excel('/Users/visheshgoyal/NeuroMechs/CleansedDataset/Dataset3.xlsx')

print("Fixed dataset saved")
