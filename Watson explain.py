import os
import json
import re
from dotenv import load_dotenv
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai.credentials import Credentials

# 🔐 Load Watson credentials
load_dotenv()
API_KEY     = os.getenv("IBM_API_KEY")
SERVICE_URL = os.getenv("IBM_SERVICE_URL")
PROJECT_ID  = os.getenv("IBM_PROJECT_ID")
assert all([API_KEY, SERVICE_URL, PROJECT_ID]), "❌ Missing Watson credentials in .env file."

# 📥 Load SHAP values
with open("shap_values_full.json", "r") as f:
    full_shap_data = json.load(f)

disease = full_shap_data.get("disease", "the target condition").strip()
all_features = full_shap_data.get("features", [])

# 🚀 Select Top 10
top10 = sorted(all_features, key=lambda x: abs(x["mean_shap_value"]), reverse=True)[:10]

# 🖋 Build prompt
feature_lines = "\n".join(
    f"- {item['feature']} (SHAP = {item['mean_shap_value']:+.4f})"
    for item in top10
)

prompt_text = (
    f"You are a medical machine learning assistant.\n\n"
    f"The following top 10 features most strongly influence predictions for **{disease}**.\n"
    f"Positive SHAP = pushes toward {disease}, negative = pushes away.\n\n"
    f"Your task:\n"
    f"- For each feature, write a clinical-style explanation of how it might relate to risk/presence of this condition.\n"
    f"- Avoid technical terms like SHAP.\n"
    f"- Output must be a JSON array of 10 objects:\n"
    f"  {{ \"name\": <feature_name>, \"description\": <clinical explanation> }}\n\n"
    f"Top 10 features:\n{feature_lines}"
)

# 🤖 Call Watsonx
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
response = watson.generate(prompt=json.dumps({"prompt": prompt_text}))
raw_response = response["results"][0]["generated_text"]

# 🔍 Parse Watson output
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
    """
    If text looks like '{"prompt": "foo"}', return "foo". Else return text as-is.
    """
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

# ⛑ Fallback generator
def explain_feature_individually(feature_name: str) -> str:
    mini_prompt = (
        f"You are a medical assistant.\n"
        f"A patient shows the measurement or symptom: **{feature_name}**.\n"
        f"Explain briefly how this could relate to the condition: **{disease}**.\n"
        f"Use clinical reasoning. Do not mention SHAP or technical terms."
    )
    response = watson.generate(prompt=json.dumps({"prompt": mini_prompt}))
    return clean_description(response["results"][0]["generated_text"])

# 🧠 Build final feature list
final_features = []
for item in top10:
    key = item["feature"].strip().lower().replace(" ", "_")
    description = desc_map.get(key)
    if not description:
        print(f"🔁 Generating fallback for missing feature: {item['feature']}")
        description = explain_feature_individually(item["feature"])
    final_features.append({
        "name": item["feature"],
        "mean_shap_value": item["mean_shap_value"],
        "description": description
    })

# 🧠 Build a natural language prompt to summarize SHAP features
def build_summary_prompt(features, disease):
    summary_intro = (
        f"You are a clinical assistant helping interpret model predictions for **{disease}**.\n\n"
        "The following features influenced the model's prediction. Features with a positive SHAP value "
        "increase the likelihood of the disease, while negative SHAP values decrease it.\n"
        "Please generate a natural clinical-style summary combining this information into a readable paragraph.\n"
        "Do not mention SHAP or machine learning terms — use reasoning based on medical knowledge.\n\n"
        "Format: A single paragraph summarizing how the symptoms relate to the prediction.\n\n"
        "Features:\n"
    )

    feature_lines = ""
    for f in features:
        direction = "increased" if f["mean_shap_value"] > 0 else "decreased"
        feature_lines += f"- {f['name'].replace('_', ' ')} ({direction} likelihood)\n"

    return summary_intro + feature_lines

summary_prompt = build_summary_prompt(final_features, disease)

# 🤖 Let Watsonx generate the summary paragraph
summary_response = watson.generate(prompt=json.dumps({"prompt": summary_prompt}))
summary_text = clean_description(summary_response["results"][0]["generated_text"])


# 📝 Save the narrative too
final_output = {
    "summary": summary_text
}
output_path = "shap_features_summary.json"
with open(output_path, "w") as f:
    json.dump(final_output, f, indent=4)

print(f"\n📝 Summary: {summary_text}")
print(f"\n✅ Saved feature descriptions + narrative for '{disease}' to {output_path}")

# 💾 Save result
output_path = "shap_features_descriptions.json"
with open(output_path, "w") as f:
    json.dump({
        "disease": disease,
        "features": final_features
    }, f, indent=4)

print(f"\n✅ Saved {len(final_features)} feature descriptions for '{disease}' to {output_path}")
