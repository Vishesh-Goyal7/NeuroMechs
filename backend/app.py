from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_input_convert import get_user_symptoms_fixed, rank_diseases, df

app = Flask(__name__)
CORS(app)  # Enable requests from React frontend

@app.route("/latest-input", methods=["GET"])
def latest_input():
    return jsonify({"input": "fever, cough"})

@app.route("/process", methods=["POST"])
def process_input():
    data = request.json
    input_symptoms = data.get("input")

    matches = []
    for raw_symptom in input_symptoms.split(","):
        results = get_user_symptoms_fixed(raw_symptom.strip(), top_k=1)
        if results:
            matches.append((results[0][0], results[0][1]))

    diseases = rank_diseases(matches, df)
    return jsonify({
        "summary": {
            "symptoms": matches,
            "diagnosis": [
                {"disease": d, "score": s} for d, s in diseases
            ]
        }
    })

if __name__ == "__main__":
    app.run(port=6969)