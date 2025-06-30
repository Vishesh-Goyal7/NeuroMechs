import json
import pandas as pd
from sentence_transformers import SentenceTransformer, util

# Load input JSON
with open("input.json", 'r') as f:
    data = json.load(f)
print(1)
# Extract symptom keys
symptoms_raw = list(data.get("input_symptoms", {}).keys())

# Load dataset
df = pd.read_csv("symptomMap.csv")
symptom_labels = df.columns[1:].tolist()  # Skip the disease column
print(2)
# Load sentence transformer model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
label_embeddings = model.encode(symptom_labels, convert_to_tensor=True)
print(3)
# Match symptoms
matched = []
for raw_symptom in symptoms_raw:
    symptom_embedding = model.encode(raw_symptom, convert_to_tensor=True)
    scores = util.cos_sim(symptom_embedding, label_embeddings)[0]
    best_match_idx = scores.argmax().item()
    matched.append(symptom_labels[best_match_idx])

# Replace keys in input_symptoms
original_values = list(data["input_symptoms"].values())
data["input_symptoms"] = dict(zip(matched, original_values))

# Save updated JSON
with open("medibot_result.json", 'w') as f:
    json.dump(data, f, indent=2)

print("Processed input JSON and saved:", "medibot_result.json")