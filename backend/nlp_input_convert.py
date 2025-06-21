import json
import re
import datetime
import torch
import pandas as pd
from sentence_transformers import SentenceTransformer, util
import os

# Load dataset
# Use relative path for portability
DF_PATH = os.path.join(os.path.dirname(__file__), "symptomMap.csv")
try:
    df = pd.read_csv(DF_PATH)
    print(f"[DEBUG] Loaded CSV: {DF_PATH}, shape: {df.shape}")
    print(f"[DEBUG] Columns: {df.columns.tolist()}")
except Exception as e:
    print(f"[ERROR] Failed to load CSV at {DF_PATH}: {e}")
    raise
symptom_cols = df.columns[1:]
symptom_texts = [col.replace("_", " ").lower() for col in symptom_cols]

# Sentence Transformer Model
st_model = SentenceTransformer('all-MiniLM-L6-v2')
symptom_embeddings = st_model.encode(symptom_texts, convert_to_tensor=True)

# Build clean symptom mapping once
SYMPTOM_LOOKUP = {
    col.replace("_", " ").lower(): col
    for col in symptom_cols
}

# Print available symptoms for debugging
print(f"[DEBUG] Loaded symptoms: {list(SYMPTOM_LOOKUP.keys())}")

def preprocess_symptoms(user_input):
    user_input = user_input.lower()
    # Remove common filler words and phrases
    user_input = re.sub(r"\b(hey|hi|hello|oh|uh|um|ah|er)\b", "", user_input)  # Added casual fillers
    user_input = re.sub(r"\b(i have|i'm|i am|i've got|feeling|suffering from|dealing with|experiencing|got|having)\b", "", user_input)
    user_input = user_input.replace(" and ", ";").replace(",", ";")
    phrases = [p.strip().strip(".") for p in user_input.split(";") if p.strip()]
    return phrases

def get_user_symptoms_fixed(user_input, top_k=5, similarity_threshold=0.4):
    cleaned_input = user_input.strip().lower()

    # Check for exact match first
    if cleaned_input in SYMPTOM_LOOKUP:
        matched_col = SYMPTOM_LOOKUP[cleaned_input]
        return [(matched_col, 1.0)]  # Perfect match

    # Else use semantic similarity only over valid symptom names
    input_embedding = st_model.encode(cleaned_input, convert_to_tensor=True)
    cos_scores = util.cos_sim(input_embedding, symptom_embeddings)[0]

    # Only consider symptoms above threshold
    indices = (cos_scores > similarity_threshold).nonzero()[0].tolist()
    matched_symptoms = [(symptom_cols[i], float(cos_scores[i])) for i in indices]
    matched_symptoms.sort(key=lambda x: x[1], reverse=True)

    return matched_symptoms[:top_k]

def rank_diseases(matched_symptoms, df, top_k=5):
    disease_scores = []
    disease_col = df.columns[0]
    for idx, row in df.iterrows():
        disease = row[disease_col]
        score = 0.0
        for symptom, weight in matched_symptoms:
            if row[symptom] == 1:
                score += weight
        if score > 0:
            disease_scores.append((disease, score))
    disease_scores.sort(key=lambda x: x[1], reverse=True)
    return disease_scores[:top_k]

def chatbot_backend(symptom_input):
    try:
        print(f"[DEBUG] Raw input: {symptom_input}")
        user_symptoms = []
        matched_symptom_scores = []
        possible_symptoms = preprocess_symptoms(symptom_input)
        print(f"[DEBUG] Preprocessed symptoms: {possible_symptoms}")
        for raw_symptom in possible_symptoms:
            matches = get_user_symptoms_fixed(raw_symptom, top_k=1)
            print(f"[DEBUG] Matches for '{raw_symptom}': {matches}")
            if matches:
                matched_symptom, score = matches[0]
                if any(s[0] == matched_symptom for s in matched_symptom_scores):
                    continue
                user_symptoms.append({"symptom": matched_symptom, "severity": 1})
                matched_symptom_scores.append((matched_symptom, score))
        print(f"[DEBUG] Matched symptoms for scoring: {matched_symptom_scores}")
        disease_scores = rank_diseases(matched_symptom_scores, df)
        print(f"[DEBUG] Disease scores: {disease_scores}")
        return {
            "symptoms": user_symptoms,
            "diagnosis": [
                {"disease": disease.replace('_', ' '), "score": round(score, 2)}
                for disease, score in disease_scores
            ]
        }
    except Exception as e:
        print(f"[ERROR] Exception in chatbot_backend: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Error processing symptom: {str(e)}"}

# If run as script, do CLI chatbot
if __name__ == "__main__":
    print("🤖 MediBot: Hello! I'm MediBot, your personal symptom checker powered by AI.")
    print("🤖 MediBot: You can enter multiple symptoms in one go (e.g., 'fever, headache') or one by one. Type 'done' when finished.\n")
    all_symptoms = []
    while True:
        user_input = input("🧑 User: ").strip()
        if user_input.lower() == 'done':
            break
        all_symptoms.append(user_input)
    if not all_symptoms:
        print("🤖 MediBot: I couldn't understand any symptoms. Please try again with more common descriptions.")
        exit()
    summary = chatbot_backend(", ".join(all_symptoms))
    print("\n🔍 MediBot: Analyzing your symptoms...")
    print("📌 Symptoms considered:")
    for entry in summary["symptoms"]:
        print(f"   - {entry['symptom']}")
    if summary["diagnosis"]:
        print("\n🩺 MediBot: Based on your symptoms, here are some possible conditions:\n")
        for idx, d in enumerate(summary["diagnosis"], 1):
            print(f"   {idx}. {d['disease']} (match score: {d['score']})")
    else:
        print("\n🤖 MediBot: Couldn't match these symptoms to any known conditions. Please consult a medical professional.")
    # Save results
    result_data = {
        "date": datetime.date.today().strftime('%Y-%m-%d'),
        "input_symptoms": summary["symptoms"],
        "possible_conditions": summary["diagnosis"]
    }
    result_path = "backend/medibot_result.json"
    with open(result_path, "w") as f:
        json.dump(result_data, f, indent=4)
    print("\n💾 Your results have been saved to 'medibot_result.json'.")
    print(f"\n📅 Date: {datetime.date.today().strftime('%B %d, %Y')}")
    print("✅ Thank you for using MediBot. Stay healthy!")