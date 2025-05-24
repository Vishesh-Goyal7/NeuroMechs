import os
import json
import base64
import re
from io import BytesIO
from PIL import Image
import pytesseract
from dotenv import load_dotenv
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai.credentials import Credentials

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv("IBM_API_KEY")
SERVICE_URL = os.getenv("IBM_SERVICE_URL")
PROJECT_ID = os.getenv("IBM_PROJECT_ID")

if not all([API_KEY, SERVICE_URL, PROJECT_ID]):
    raise ValueError("❌ Missing IBM_API_KEY, IBM_SERVICE_URL, or IBM_PROJECT_ID in .env")

# Prompt user for image path
image_path = input("📷 Enter the full path to your SHAP summary plot image: ").strip()
if not os.path.isfile(image_path):
    print("❌ Invalid file path.")
    exit()

# Load and resize image for OCR and base64 encoding
try:
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        img.thumbnail((512, 512))  # Resize to max 512x512 to keep payload manageable
        buffer = BytesIO()
        img.save(buffer, format="JPEG")
        img_bytes = buffer.getvalue()
except Exception as e:
    print(f"❌ Error reading image: {e}")
    exit()

# Perform OCR to extract text features from the image
try:
    with Image.open(image_path) as ocr_img:
        text = pytesseract.image_to_string(ocr_img)
    print("\n📝 Extracted Text via OCR:\n", text)
except Exception as e:
    print(f"❌ OCR failed: {e}")
    exit()

# --- START: Extract features and SHAP value range from OCR text and save JSON ---

# Extract feature names: everything before 'SHAP Summary Plot'
features_section = text.split("SHAP Summary Plot")[0]

# Clean and collect feature names (replace spaces and dashes with underscores)
features = [
    line.strip().replace(" ", "_").replace("-", "_")
    for line in features_section.splitlines()
    if line.strip()
]

# Filter out invalid entries (like axis labels or words)
features = [
    f for f in features if f and not re.match(
        r"SHAP|value|impact|plot|—|0\.0|high|low|Feature", f, re.I
    )
]

# Extract SHAP values (min and max) from text (e.g. "-0.1 0.1 0.2")
shap_values_found = re.findall(r"[-—]?\d+\.\d+", text)
shap_values = [float(v.replace("—", "-")) for v in shap_values_found]

min_val = min(shap_values) if shap_values else None
max_val = max(shap_values) if shap_values else None

# Build features list with shap_value_range
features_data = []
for f in features:
    features_data.append({
        "name": f,
        "shap_value_range": {"min": min_val, "max": max_val},
        "description": ""  # placeholder for later enrichment
    })

# Save to JSON file
try:
    with open("shap_features_with_range.json", "w") as f:
        json.dump(features_data, f, indent=4)
    print(f"✅ Extracted {len(features)} features with SHAP value range ({min_val}, {max_val}) saved to shap_features_with_range.json")
except Exception as e:
    print(f"❌ Failed to save features JSON: {e}")

# --- END: Feature extraction and saving ---

# Encode the resized image to base64 for possible future use (not required for text prompt)
img_b64 = base64.b64encode(img_bytes).decode("utf-8")
if len(img_b64) > 160000:
    print("⚠️ Warning: Image too large after resizing. Try a smaller image.")
    exit()

# Setup IBM watsonx.ai model inference client
credentials = Credentials(api_key=API_KEY, url=SERVICE_URL)
model = ModelInference(
    model_id="meta-llama/llama-3-2-90b-vision-instruct",
    credentials=credentials,
    project_id=PROJECT_ID,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.MAX_NEW_TOKENS: 300,
        GenParams.MIN_NEW_TOKENS: 50,
    },
)

# Construct prompt with extracted text
prompt_data = {
    "prompt": (
        "You are a data science assistant.\n"
        "Here is a list of features extracted from a SHAP summary plot:\n\n"
        f"{text.strip()}\n\n"
        "Instructions:\n"
        "- Identify the top 5 features based on SHAP relevance (assume listed order).\n"
        "- Describe each feature's potential impact on the model.\n"
        "- Make reasonable clinical or behavioral assumptions.\n"
        "- Provide your explanation in clear, plain English.\n"
    )
}

# Call the model and handle response
try:
    response = model.generate(prompt=json.dumps(prompt_data))
    print("\n🧠 Raw model response received.")
except Exception as e:
    print(f"❌ Model call failed: {e}")
    exit()

def clean_description(desc):
    # Basic improvements: fix spacing, capitalization, punctuation.
    desc = desc.strip()
    if not desc.endswith('.'):
        desc += '.'
    desc = desc[0].upper() + desc[1:]  # Capitalize first letter
    return desc

def extract_feature_names(text):
    # Basic feature name extraction: assuming one feature per line
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return lines[:5]  # limit to top 5 for relevance

try:
    raw_response = response["results"][0]["generated_text"]
    print("\n🔍 Raw LLM Output (preview):\n", raw_response[:500])

    # Extract feature names
    feature_names = extract_feature_names(text)

    # Extract descriptions
    json_objects = re.findall(r'\{.*?\}', raw_response, re.DOTALL)
    descriptions = []
    for obj_str in json_objects:
        try:
            obj = json.loads(obj_str)
            if "description" in obj:
                obj["description"] = clean_description(obj["description"])
                descriptions.append(obj["description"])
        except json.JSONDecodeError:
            continue

    # Combine all into a unified list of dicts
    final_output = []
    for i, name in enumerate(feature_names):
        final_output.append({
            "name": name.lower().replace(" ", "_"),
            "description": descriptions[i] if i < len(descriptions) else "No description available."
        })

    # Save to JSON
    with open("shap_output.json", "w") as f:
        json.dump(final_output, f, indent=4)
    print("📁 Complete structured explanation saved to shap_output.json")

except Exception as e:
    print(f"❌ Failed to process and save complete explanation: {e}")