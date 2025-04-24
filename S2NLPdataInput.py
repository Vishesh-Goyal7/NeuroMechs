import pandas as pd
from sentence_transformers import SentenceTransformer, util

file_path = '/Users/visheshgoyal/NeuroMechs/CleansedDataset/Dataset3.csv'
df = pd.read_csv(file_path)

model = SentenceTransformer('all-MiniLM-L6-v2')  

symptoms = df.columns.tolist()[1:]

display_symptoms = [s.replace('_', ' ').lower() for s in symptoms]

symptom_embeddings = model.encode(display_symptoms)

def match_symptom_semantic(user_input):
    inputs = [i.strip().lower() for i in user_input.split(',')]
    matched_symptoms = {}

    for input_symptom in inputs:
        input_embedding = model.encode(input_symptom)
        similarities = util.cos_sim(input_embedding, symptom_embeddings)
        best_match_idx = similarities.argmax()
        best_match_score = similarities[0, best_match_idx].item()

        if best_match_score > 0.5:  
            matched_symptoms[input_symptom] = symptoms[best_match_idx]
        else:
            matched_symptoms[input_symptom] = None

    return matched_symptoms

user_input = input("Enter patient symptoms : ")
matches = match_symptom_semantic(user_input)

print("Symptom Matches:")
for k, v in matches.items():
    if v:
        print(f"Input: '{k}' ➔ Matched: '{v}'")
    else:
        print(f"Input: '{k}' ➔ No good match found.")