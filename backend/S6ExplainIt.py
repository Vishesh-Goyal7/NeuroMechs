## Add explainability to this damn thing

import shap
import json
import os
import numpy as np
import pandas as pd
import shutil
import matplotlib.pyplot as plt
from S5DiseasePredictIteration2 import XGBoostDiseasePredictor
import xgboost as xgb

def predict_and_explain_top_n(json_path, dataset_path="your_dataset.csv", model_path="disease_model", top_n=5, output_dir="shap_outputs"):
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    # Load model and dataset
    predictor = XGBoostDiseasePredictor(model_path=model_path)
    df = pd.read_csv(dataset_path)
    disease_names = sorted(df.iloc[:, 0].unique().tolist())

    # Load input symptoms JSON
    with open(json_path, 'r') as f:
        data = json.load(f)

    input_symptoms = data.get("input_symptoms", {})
    input_vector = predictor.get_symptom_template()
    for symptom, score in input_symptoms.items():
        if symptom in input_vector:
            input_vector[symptom] = 1

    input_array = np.array(list(input_vector.values())).reshape(1, -1)
    predictions = predictor.predict_top_n(input_array[0], top_n=top_n)

    # Use XGBoost's built-in SHAP value calculation for memory efficiency
    booster = predictor.model.get_booster()
    dmatrix = xgb.DMatrix(input_array, feature_names=predictor.symptom_names)
    shap_values = booster.predict(dmatrix, pred_contribs=True)

    output_graph_paths = {}
    explanation_json = {}

    for disease, probability in predictions:
        class_idx = disease_names.index(disease)
        # For multiclass, select the correct class row
        class_shap = shap_values[0][class_idx]  # shape: (num_features + 1,)

        # Save waterfall plot
        fig = shap.plots._waterfall.waterfall_legacy(
            expected_value=float(class_shap[-1]),  # The last value is the expected value (bias)
            shap_values=class_shap[:-1],  # All but the last are feature SHAP values
            feature_names=predictor.symptom_names,
            features=input_array[0],
            max_display=10,
            show=False
        )
        plot_path = os.path.join(output_dir, f"{disease}_shap.png")
        plt.savefig(plot_path, bbox_inches="tight")
        plt.close()
        output_graph_paths[disease] = plot_path

        # Convert all values to Python float before JSON dump
        shap_vals = {symptom: float(class_shap[i]) for i, symptom in enumerate(predictor.symptom_names)}
        input_vals = {symptom: float(input_array[0][i]) for i, symptom in enumerate(predictor.symptom_names)}

        explanation_json[disease] = {
            "expected_value": float(class_shap[-1]),
            "probability": float(probability),
            "shap_values": shap_vals,
            "input_values": input_vals
        }

    # Write all explanations to a single JSON file
    explanation_path = os.path.join(output_dir, "shap_explanations.json")
    with open(explanation_path, "w") as f:
        json.dump(explanation_json, f, indent=2)

    return predictions, output_graph_paths, explanation_path