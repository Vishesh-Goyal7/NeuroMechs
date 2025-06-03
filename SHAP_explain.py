import os
import json
import re
from dotenv import load_dotenv
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai.credentials import Credentials

# Load Watson credentials from environment variables
load_dotenv()
API_KEY     = os.getenv("IBM_API_KEY")
SERVICE_URL = os.getenv("IBM_SERVICE_URL")
PROJECT_ID  = os.getenv("IBM_PROJECT_ID")
assert all([API_KEY, SERVICE_URL, PROJECT_ID]), "Missing Watson credentials in .env file."

# Load SHAP values from file
with open("shap_values_full.json", "r") as f:
    full_shap_data = json.load(f)

disease = full_shap_data.get("disease", "the target condition").strip()
all_features = full_shap_data.get("features", [])

# Select top 10 features based on absolute mean SHAP value
top10 = sorted(all_features, key=lambda x: abs(x["mean_shap_value"]), reverse=True)[:10]

# Build prompt for Watson
feature_lines = "\n".join(
    f"- {item['feature']} (SHAP = {item['mean_shap_value']:+.4f})"
    for item in top10
)

prompt_text = (
    f"You are a medical machine learning assistant.\n\n"
    f"The following top 10 features most strongly influence predictions for {disease}.\n"
    f"Positive SHAP means the feature increases likelihood of {disease}, negative means it decreases likelihood.\n\n"
    f"Your task:\n"
    f"- For each feature, write a clinical explanation of how it might relate to the risk or presence of this condition.\n"
    f"- Avoid technical terms like SHAP.\n"
    f"- Provide the output as a JSON array with 10 objects:\n"
    f"  {{ \"name\": <feature_name>, \"description\": <clinical explanation> }}\n\n"
    f"Top 10 features:\n{feature_lines}"
)

# Initialize Watson client
credentials = Credentials(api_key=API_KEY, url=SERVICE_URL)
watson = ModelInference(
    model_id="meta-llama/llama-3-2-90b-vision-instruct",
    credentials=credentials,
    project_id=PROJECT_ID,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.MAX_NEW_TOKENS: 400,
        GenParams.MIN_NEW_TOKENS: 50,
    },
)

# Generate response from Watson
response = watson.generate(prompt=json.dumps({"prompt": prompt_text}))
raw_response = response["results"][0]["generated_text"]

# Functions to clean and parse Watson output
def clean_raw_response(text: str) -> str:
    text = text.strip()
    text = re.sub(r'^<\|start_header_id\|>.*?<\|end_header_id\|>\n*', '', text, flags=re.DOTALL)
    text = re.sub(r'^{"response":\s*', '', text)
    text = re.sub(r'}\s*$', '', text)
    return text.strip()

def try_parse_json(text: str):
    try:
        return json.loads(text)
    except:
        matches = re.findall(r'\{.*?\}', text, re.DOTALL)
        parsed = []
        for m in matches:
            try:
                parsed.append(json.loads(m))
            except:
                continue
        return parsed

def unwrap_json_string(text: str) -> str:
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and len(obj) == 1:
            return next(iter(obj.values()))
    except json.JSONDecodeError:
        pass
    return text

def clean_description(desc: str) -> str:
    desc = desc.strip().rstrip('.')
    desc = unwrap_json_string(desc)
    desc = desc.strip().strip('"\'')

    if not desc.endswith('.'):
        desc += '.'
    return desc[0].upper() + desc[1:]

parsed_json = try_parse_json(clean_raw_response(raw_response))
desc_map = {
    f["name"].strip().lower().replace(" ", "_"): clean_description(f["description"])
    for f in parsed_json
}

# Fallback: explain features individually if missing
def explain_feature_individually(feature_name: str) -> str:
    mini_prompt = (
        f"You are a medical assistant.\n"
        f"A patient has the symptom or measurement: {feature_name}.\n"
        f"Briefly explain how this might relate to the condition {disease}.\n"
        f"Use clinical reasoning and avoid technical terms."
    )
    response = watson.generate(prompt=json.dumps({"prompt": mini_prompt}))
    return clean_description(response["results"][0]["generated_text"])

# Build final list of features with explanations
final_features = []
for item in top10:
    key = item["feature"].strip().lower().replace(" ", "_")
    description = desc_map.get(key)
    if not description:
        print(f"Generating explanation for missing feature: {item['feature']}")
        description = explain_feature_individually(item["feature"])
    final_features.append({
        "name": item["feature"],
        "mean_shap_value": item["mean_shap_value"],
        "description": description
    })

# Build a summary prompt combining the features
def build_summary_prompt(features, disease):
    summary_intro = (
        f"You are a clinical assistant interpreting model predictions for {disease}.\n\n"
        "These features influenced the prediction. Positive values increase the likelihood of the disease; "
        "negative values decrease it.\n"
        "Please write a clear, clinical-style summary paragraph that explains how these features relate to the prediction.\n"
        "Avoid mentioning SHAP or any machine learning terms.\n\n"
        "Features:\n"
    )

    feature_lines = ""
    for f in features:
        direction = "increased" if f["mean_shap_value"] > 0 else "decreased"
        feature_lines += f"- {f['name'].replace('_', ' ')} ({direction} likelihood)\n"

    return summary_intro + feature_lines

summary_prompt = build_summary_prompt(final_features, disease)

# Generate the summary paragraph
summary_response = watson.generate(prompt=json.dumps({"prompt": summary_prompt}))
summary_text = clean_description(summary_response["results"][0]["generated_text"])

# Save the narrative summary
final_output = {
    "summary": summary_text
}
output_path = "shap_features_summary.json"
with open(output_path, "w") as f:
    json.dump(final_output, f, indent=4)

print(f"\nSummary:\n{summary_text}")
print(f"\nSaved the narrative summary for '{disease}' to {output_path}")

# Save detailed feature descriptions
output_path = "shap_features_descriptions.json"
with open(output_path, "w") as f:
    json.dump({
        "disease": disease,
        "features": final_features
    }, f, indent=4)

print(f"\nSaved {len(final_features)} feature descriptions for '{disease}' to {output_path}")
