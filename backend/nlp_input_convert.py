import json
import re
import io
import sys
import datetime
import torch
import os
import pandas as pd
from sentence_transformers import SentenceTransformer, util
import httpx

from dotenv import load_dotenv
load_dotenv()

# Load dataset
df = pd.read_csv("/Users/tanishta/Desktop/NeuroMechs-pipeline/backend/symptomMap.csv")
symptom_cols = df.columns[1:]
symptom_texts = [col.replace("_", " ").lower() for col in symptom_cols]

# Sentence Transformer Model
st_model = SentenceTransformer('all-MiniLM-L6-v2')
symptom_embeddings = st_model.encode(symptom_texts, convert_to_tensor=True)

def query_ollama(prompt, model="mistral:instruct"):
    OLLAMA_URL = "http://localhost:11434/api/generate"
    response = httpx.post(
        OLLAMA_URL,
        json={
            "model": model,
            "prompt": f"User reports: {prompt}. What else might be related? Only use information about '{prompt}'. Keep the response concise.",
            "stream": False,
            "options": {"temperature": 0.7}
        },
        timeout=120
    )
    data = response.json()
    if "response" not in data:
        print("Ollama API error or unexpected response:", data)
        raise ValueError("Ollama API did not return a 'response' key.")
    return data["response"]

def preprocess_symptoms(user_input):
    user_input = user_input.lower()
    # Remove common filler words and phrases
    user_input = re.sub(r"\b(hey|hi|hello|oh|uh|um|ah|er)\b", "", user_input)  # Added casual fillers
    user_input = re.sub(r"\b(i have|i'm|i am|i've got|feeling|suffering from|dealing with|experiencing|got|having)\b", "", user_input)
    user_input = user_input.replace(" and ", ";").replace(",", ";")
    phrases = [p.strip().strip(".") for p in user_input.split(";") if p.strip()]
    return phrases

# Build clean symptom mapping once
SYMPTOM_LOOKUP = {
    col.replace("_", " ").lower(): col
    for col in symptom_cols
}

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
    matched_symptoms = [(symptom_columns[i], float(cos_scores[i])) for i in indices]
    matched_symptoms.sort(key=lambda x: x[1], reverse=True)

    return matched_symptoms[:top_k]

def match_symptom_semantic(user_input):
    inputs = [i.strip().lower() for i in user_input.split(',')]
    matched_symptoms = {}
    for input_symptom in inputs:
        input_embedding = st_model.encode(input_symptom, convert_to_tensor=True).to(symptom_embeddings.device)
        similarities = util.cos_sim(input_embedding, symptom_embeddings)
        best_match_idx = similarities.argmax()
        best_match_score = similarities[0, best_match_idx].item()
        if best_match_score > 0.0:
            matched_symptoms[input_symptom] = symptom_cols[int(best_match_idx)]
        else:
            matched_symptoms[input_symptom] = None
    return matched_symptoms

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

def chatbot_interaction():
    user_symptoms = []
    matched_symptom_scores = []

    print("🤖 MediBot: Hello! I'm MediBot, your personal symptom checker powered by AI.")
    print("🤖 MediBot: You can enter multiple symptoms in one go (e.g., 'fever, headache') or one by one.")
    print("           Type 'done' when you're finished.\n")

    while True:
        user_input = input("🧑 User: ").strip()
        if user_input.lower() == 'done':
            break

        possible_symptoms = preprocess_symptoms(user_input)
        for raw_symptom in possible_symptoms:
            print("Debug: raw_symptom =", raw_symptom)
            matches = get_user_symptoms_fixed(raw_symptom, top_k=5)
            print("Debug: matches =", matches)
            if matches:
                matched_symptom, score = matches[0]
                if any(s["symptom"] == matched_symptom for s in user_symptoms):
                    continue
                severity_input = input(f"🤖 MediBot: On a scale of 0.1 to 1, how severe is your '{matched_symptom}'? (Press Enter to skip): ").strip()
                try:
                    severity = float(severity_input)
                    if not (0.1 <= severity <= 1):
                        print("❗ Please enter a number between 0.1 and 1.")
                        severity = 1
                except ValueError:
                    print("⚠️ No valid severity provided. Defaulting severity to 1.")
                    severity = 1
                user_symptoms.append({"symptom": matched_symptom, "severity": severity})
                matched_symptom_scores.append((matched_symptom, score * severity))
                print(f"🤖 MediBot: Got it. You're experiencing '{matched_symptom}'.")
            else:
                print(f"🤖 MediBot: Couldn't confidently match '{raw_symptom}'. Please rephrase or try another symptom.")

    if not user_symptoms:
        print("\n🤖 MediBot: I couldn't understand any symptoms. Please try again with more common descriptions.")
        return

    print("\n🔍 MediBot: Analyzing your symptoms...")
    print("📌 Symptoms considered:")
    for entry in user_symptoms:
        print(f"   - {entry['symptom']} (severity: {entry['severity']})")

    disease_scores = rank_diseases(matched_symptom_scores, df)

    if disease_scores:
        print("\n🩺 MediBot: Based on your symptoms, here are some possible conditions:\n")
        for idx, (disease, score) in enumerate(disease_scores, 1):
            print(f"   {idx}. {disease.replace('_', ' ')} (match score: {score:.2f})")
    else:
        print("\n🤖 MediBot: Couldn't match these symptoms to any known conditions. Please consult a medical professional.")

    result_data = {
        "date": datetime.date.today().strftime('%Y-%m-%d'),
        "input_symptoms": user_symptoms,
        "possible_conditions": [
            {"disease": disease.replace('_', ' '), "match_score": round(score, 1)}
            for disease, score in disease_scores
        ]
    }

    result_path = "/Users/tanishta/Desktop/NeuroMechs-pipeline/backend/medibot_result.json"
    with open(result_path, "w") as f:
        json.dump(result_data, f, indent=4)

    print("\n💾 Your results have been saved to 'medibot_results.json'.")
    print(f"\n📅 Date: {datetime.date.today().strftime('%B %d, %Y')}")
    print("✅ Thank you for using MediBot. Stay healthy!")

if __name__ == "__main__":
    chatbot_interaction()