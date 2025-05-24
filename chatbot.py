import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from sentence_transformers import SentenceTransformer, util
import re
import datetime
import os
import json
from huggingface_hub import login, whoami

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "mistralai/Mistral-7B-Instruct-v0.1"
token = "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"  # Replace with your token

tokenizer = AutoTokenizer.from_pretrained(model_id, token=token, use_fast=False)
model = AutoModelForCausalLM.from_pretrained(model_id, use_auth_token=token, device_map="auto", torch_dtype=torch.float16)

inputs = tokenizer("Hello, how are you?", return_tensors="pt")
outputs = model.generate(**inputs)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))

llm_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    device=-1  # Force CPU
)

df = pd.read_csv("/Users/tanishta/Desktop/Work/Deloitte/symptomMap.csv")  # Or upload your CSV
all_symptoms = df.columns[:-1].tolist()

def ask_llm(user_symptom_input, known_symptoms):
    symptom_list_str = ", ".join(known_symptoms)
    prompt = (
    "You are a medical chatbot. When a user tells you a symptom, "
    "identify and acknowledge it. If the user says 'done', end the list.\n\n"
)
    response = llm_pipeline(prompt, max_new_tokens=100, do_sample=True, temperature=0.7)[0]['generated_text']

    # Extract only the list from the response
    try:
        extracted = eval(response.split("[")[-1].split("]")[0])
        if isinstance(extracted, str):  # Convert single string to list
            return [extracted.strip()]
        return [sym.strip() for sym in extracted]
    except:
        return []
    
def get_matching_diseases(symptoms):
    if not symptoms:
        return []
    filtered = df.copy()
    for symptom in symptoms:
        if symptom in filtered.columns:
            filtered = filtered[filtered[symptom] == 1]
    # Access the disease column using its actual name from the DataFrame
    # This could be 'Disease' or another name, check your CSV file
    return filtered['Disease'].unique().tolist() # Changed 'disease' to 'Disease'

model = SentenceTransformer('all-MiniLM-L6-v2')

symptom_cols = df.columns[1:]
symptom_texts = [col.replace("_", " ").lower() for col in symptom_cols]

symptom_embeddings = model.encode(symptom_texts, convert_to_tensor=True)

def get_user_symptoms(user_input, top_k=5, similarity_threshold=0.4):
    input_embedding = model.encode(user_input, convert_to_tensor=True)
    cos_scores = util.cos_sim(input_embedding, symptom_embeddings)[0]
    top_results = (cos_scores > similarity_threshold).nonzero()

    # Check if top_results[0] is a string and convert to a list if necessary
    indices = top_results[0]
    if not isinstance(indices, torch.Tensor): # Check if indices is a Tensor and convert to list
        indices = [int(indices)] if isinstance(indices, str) else [indices] # Convert string/int to list
    else:
        indices = indices.tolist() # Convert Tensor to list

    matched_symptoms = [(symptom_cols[i], float(cos_scores[i])) for i in indices]  # Use the indices list
    matched_symptoms.sort(key=lambda x: x[1], reverse=True)

    return matched_symptoms[:top_k]

def get_user_symptoms(user_input, top_k=5, similarity_threshold=0.4):
    input_embedding = model.encode(user_input, convert_to_tensor=True)
    cos_scores = util.cos_sim(input_embedding, symptom_embeddings)[0]
    top_results = (cos_scores > similarity_threshold).nonzero()

    # Check if top_results is empty
    if top_results.size(0) == 0:  # If top_results is empty
        return []  # Return an empty list to indicate no matches

    # Check if top_results[0] is a string and convert to a list if necessary
    indices = top_results[0] # Access the first element only if top_results is not empty
    if not isinstance(indices, torch.Tensor): # Check if indices is a Tensor and convert to list
        indices = [int(indices)] if isinstance(indices, str) else [indices] # Convert string/int to list
    else:
        indices = indices.tolist() # Convert Tensor to list

    matched_symptoms = [(symptom_cols[i], float(cos_scores[i])) for i in indices]  # Use the indices list
    matched_symptoms.sort(key=lambda x: x[1], reverse=True)

    return matched_symptoms[:top_k]

def match_symptom_semantic(user_input):
    inputs = [i.strip().lower() for i in user_input.split(',')]
    matched_symptoms = {}

    for input_symptom in inputs:
        input_embedding = model.encode(input_symptom, convert_to_tensor=True).to(symptom_embeddings.device)
        similarities = util.cos_sim(input_embedding, symptom_embeddings)
        best_match_idx = similarities.argmax()
        best_match_score = similarities[0, best_match_idx].item()

        if best_match_score > 0.0:
            matched_symptoms[input_symptom] = symptom_cols[int(best_match_idx)]
        else:
            matched_symptoms[input_symptom] = None

    return matched_symptoms

def preprocess_symptoms(user_input):
    user_input = user_input.lower()
    user_input = re.sub(r"\b(i have|i'm|i am|i've got|feeling|suffering from|dealing with|experiencing|got|having)\b", "", user_input)
    user_input = user_input.replace(" and ", ";").replace(",", ";")
    phrases = [p.strip().strip(".") for p in user_input.split(";") if p.strip()]

    return phrases

def chatbot_interaction():
    user_symptoms = []
    print("MediBot: Hello! I'm here to help you understand your symptoms.")
    
    while True:
        user_input = input("User: Enter a symptom (or type 'done' if finished): ")
        if user_input.lower() == 'done':
            break
        user_symptoms.append(user_input)

        # Mistral for chatbot-like response:
        prompt = f"MediBot: Okay, you mentioned {user_input}. Anything else?"
        response = llm_pipeline(prompt, max_new_tokens=50, do_sample=True, temperature=0.7)[0]['generated_text']
        print(response)

    # Save symptoms to symptoms.json
    with open('symptoms.json', 'w') as f:
        json.dump({"entered_symptoms": user_symptoms}, f, indent=4)

    matches = match_symptom_semantic(", ".join(user_symptoms))

    print("\nMediBot: Symptom Matches:")
    for k, v in matches.items():
        if v:
            print(f"Input: '{k}' ➔ Matched: '{v}'")
        else:
            print(f"Input: '{k}' ➔ No good match found.")

    # Disease prediction based on matched symptoms
    matched_symptoms_list = [v for k, v in matches.items() if v is not None]
    predicted_diseases = get_matching_diseases(matched_symptoms_list)

    if predicted_diseases:
        print("\nMediBot: Possible Diseases:")
        for disease in predicted_diseases:
            print(f"- {disease}")
    else:
        print("\nMediBot: No matching diseases found in the dataset.")

    # Save predicted diseases to possible_diseases.json
    with open('possible_diseases.json', 'w') as f:
        json.dump({"possible_diseases": predicted_diseases}, f, indent=4)

# Run the interaction
chatbot_interaction()