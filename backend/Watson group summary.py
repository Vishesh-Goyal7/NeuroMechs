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
assert all([API_KEY, SERVICE_URL, PROJECT_ID]), "Missing Watson credentials in the .env file."

# Initialize Watsonx client
credentials = Credentials(api_key=API_KEY, url=SERVICE_URL)
watson = ModelInference(
    model_id="meta-llama/llama-3-2-90b-vision-instruct",
    credentials=credentials,
    project_id=PROJECT_ID,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.MAX_NEW_TOKENS: 300,
        GenParams.MIN_NEW_TOKENS: 50,
    },
)

# Load the SHAP explanation input file
with open("shap_outputs/shap_explanations.json", "r") as f:
    shap_data = json.load(f)

def pretty(feature_name: str) -> str:
    return feature_name.replace('_', ' ')

def build_summary_prompt(disease: str, shap_vals: dict, input_vals: dict, probability: float) -> str:
    positive_features = []
    negative_features = []
    for feature, shap_val in shap_vals.items():
        if input_vals.get(feature, 0) == 1:
            if shap_val > 0.01:
                positive_features.append((feature, shap_val))
            elif shap_val < -0.01:
                negative_features.append((feature, shap_val))
    positive_features.sort(key=lambda x: -x[1])
    negative_features.sort(key=lambda x: x[1])
    top_pos = [pretty(f) for f, _ in positive_features[:3]]
    top_neg = [pretty(f) for f, _ in negative_features[:3]]

    prompt = f"You are a clinical reasoning assistant.\n"
    prompt += f"The model predicted a likelihood of {pretty(disease)} for a patient.\n\n"
    prompt += "Based on these key findings:\n"
    if top_pos:
        prompt += f"- The following symptoms support the diagnosis: {', '.join(top_pos)}.\n"
    if top_neg:
        prompt += f"- The following symptoms argue against it: {', '.join(top_neg)}.\n"
    if not top_pos and not top_neg:
        prompt += "- No major symptoms significantly influenced this prediction.\n"
    prompt += (
        "\nPlease write a single-paragraph clinical summary that "
        "explains how the symptoms relate to the condition. "
        "Provide a clean output without text like 'name': 'clinical_summary', 'response': in the output. "
        "Use clinical reasoning and write as a junior doctor performing a basic evaluation. "
        "Do not mention SHAP values or probabilities."
    )
    return prompt

def clean_response(raw_text: str) -> str:
    text = raw_text.strip()
    text = re.sub(r"<\|.*?\|>", "", text)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "prompt" in parsed:
            text = parsed["prompt"]
    except json.JSONDecodeError:
        pass
    text = text.strip().strip('"\'')

    if not text.endswith('.'):
        text += '.'
    if text:
        text = text[0].upper() + text[1:]
    return text

def data_cleanse(summary: str) -> str:
    """
    Clean model output to extract inner 'response' from a JSON-like string
    or sanitize misformatted entries. Handles escaped JSON too.
    """
    summary = summary.strip().strip('"\'')

    for _ in range(2):
        try:
            parsed = json.loads(summary)
            if isinstance(parsed, dict) and "response" in parsed:
                return parsed["response"]
            elif isinstance(parsed, str):
                summary = parsed
            else:
                break
        except json.JSONDecodeError:
            break

    summary = re.sub(r'}\s*\.*$', '', summary).strip(' "\'')
    return summary


# Process each disease in the SHAP data
final_explanations = {}

for disease, contents in shap_data.items():
    shap_vals = contents.get("shap_values", {})
    input_vals = contents.get("input_values", {})
    probability = contents.get("probability", 0)

    prompt_text = build_summary_prompt(disease, shap_vals, input_vals, probability)
    response = watson.generate(prompt=json.dumps({"prompt": prompt_text}))
    raw_generated = response["results"][0]["generated_text"]

    clean_text = clean_response(raw_generated)
    cleansed_text = data_cleanse(clean_text)

    final_explanations[disease] = cleansed_text
    print(f"Generated summary for {disease}: {cleansed_text[:60]}...")

# Save the cleaned explanations to a JSON file
with open("shap_outputs/shap_explanation_summary.json", "w") as out_f:
    json.dump(final_explanations, out_f, indent=2)

print("\nAll explanations have been saved to 'shap_explanation_summary.json'.")
