import shap
import json
import os
import shutil
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from S5DiseasePredictIteration2 import XGBoostDiseasePredictor

def predict_and_explain_top_n(json_path, dataset_path="your_dataset.csv", model_path="disease_model", top_n=5, output_dir="shap_outputs"):
    
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    predictor = XGBoostDiseasePredictor(model_path=model_path)
    df = pd.read_csv(dataset_path)
    disease_names = sorted(df.iloc[:, 0].unique().tolist())

    with open(json_path, 'r') as f:
        data = json.load(f)

    input_symptoms = data.get("input_symptoms", {})
    input_vector = predictor.get_symptom_template()
    for symptom, score in input_symptoms.items():
        if symptom in input_vector:
            input_vector[symptom] = 1

    input_array = np.array(list(input_vector.values())).reshape(1, -1)
    predictions = predictor.predict_top_n(input_array[0], top_n=top_n)

    explainer = shap.TreeExplainer(predictor.model)
    shap_values = explainer.shap_values(input_array)

    output_graph_paths = {}

    for disease, _ in predictions:
        class_idx = disease_names.index(disease)
        class_shap = shap_values[0, :, class_idx]

        fig = shap.plots._waterfall.waterfall_legacy(
            expected_value=explainer.expected_value[class_idx],
            shap_values=class_shap,
            feature_names=predictor.symptom_names,
            features=input_array[0],
            max_display=10,
            show=False
        )

        plot_path = os.path.join(output_dir, f"{disease}_shap.png")
        plt.savefig(plot_path, bbox_inches="tight")
        plt.close()
        output_graph_paths[disease] = plot_path

    return predictions, output_graph_paths
