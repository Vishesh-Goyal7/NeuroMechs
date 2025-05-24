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

# --- Extract feature names from OCR text ---

# Extract feature names: everything before 'SHAP Summary Plot'
features_section = text.split("SHAP Summary Plot")[0]

# Clean and collect feature names (replace spaces and dashes with underscores)
features = [
    line.strip().replace(" ", "_").replace("-", "_")
    for line in features_section.splitlines()
    if line.strip()
]

# Filter out invalid entries (like axis labels or irrelevant words)
features = [
    f for f in features if f and not re.match(
        r"SHAP|value|impact|plot|—|0\.0|high|low|Feature", f, re.I
    )
]

if not features:
    print("❌ No features found in OCR text.")
    exit()

# --- Setup IBM watsonx.ai model inference client ---

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

# Construct prompt with extracted features
prompt_text = (
    "You are a data science assistant.\n"
    "Here is a list of features extracted from a SHAP summary plot:\n\n"
    + "\n".join(features) +
    "\n\nInstructions:\n"
    "- For each feature, provide a clear, plain English description of its potential impact on the model.\n"
    "- Use clinical or behavioral reasoning if applicable.\n"
    "- Provide the output as a JSON array of objects, each with 'name' and 'description' fields.\n"
    "- Make sure descriptions are concise but informative.\n"
)

prompt_data = {"prompt": prompt_text}

# Call the model and handle response
try:
    response = model.generate(prompt=json.dumps(prompt_data))
    print("\n🧠 Raw model response received.")
except Exception as e:
    print(f"❌ Model call failed: {e}")
    exit()

# --- Process model output to extract descriptions ---

raw_response = response["results"][0]["generated_text"]
print("\n🔍 Raw LLM Output (preview):\n", raw_response[:500])

# Extract JSON objects from model output (expecting a JSON array or multiple JSON objects)
try:
    # Attempt to parse the whole raw response as JSON
    parsed_json = json.loads(raw_response)
except json.JSONDecodeError:
    # Fallback: extract JSON objects with regex and parse them individually
    json_objects_str = re.findall(r'\{.*?\}', raw_response, re.DOTALL)
    parsed_json = []
    for obj_str in json_objects_str:
        try:
            obj = json.loads(obj_str)
            parsed_json.append(obj)
        except json.JSONDecodeError:
            continue

if not parsed_json:
    print("❌ No valid JSON descriptions found in model output.")
    exit()

# Clean description text
def clean_description(desc):
    desc = desc.strip()
    if not desc.endswith('.'):
        desc += '.'
    desc = desc[0].upper() + desc[1:]
    return desc

# Create a dict from parsed_json keyed by feature name
desc_map = {}
for item in parsed_json:
    name = item.get("name")
    desc = item.get("description", "No description available.")
    if name:
        desc_map[name.lower().replace(" ", "_")] = clean_description(desc)

# Build final features list with name and description
final_features = []
for feature in features:
    description = desc_map.get(feature.lower(), "No description available.")
    final_features.append({
        "name": feature.lower(),
        "description": description
    })

# Save combined output to JSON file
try:
    with open("shap_features_descriptions.json", "w") as f:
        json.dump(final_features, f, indent=4)
    print(f"✅ Saved {len(final_features)} features with descriptions to shap_features_descriptions.json")
except Exception as e:
    print(f"❌ Failed to save JSON: {e}")