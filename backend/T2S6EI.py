## Run the symptoms to execute the explainability

import os
from S6ExplainIt import predict_and_explain_top_n

# Run prediction + explanation
preds, graph_paths, exp_path = predict_and_explain_top_n(
    json_path="medibot_result.json",
    dataset_path="filtered_dataset_min15.csv",
    model_path="disease_model",          
    top_n=10,
    output_dir="shap_outputs"
)

print("Top Predictions:")
for disease, prob in preds:
    print(f"{disease}: {prob:.4f}")

print("\nSHAP Explanation Graphs:")
for disease, path in graph_paths.items():
    print(f"{disease}: {path}")
