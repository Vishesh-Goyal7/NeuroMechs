## Run the symptoms to execute the explainability

import os
from S6ExplainIt import predict_and_explain_top_n

root = os.path.dirname(os.path.abspath(__file__))

# Run prediction + explanation
preds, graph_paths, exp_path = predict_and_explain_top_n(
    json_path=os.path.join(root, "temp.json"),
    dataset_path=os.path.join(root, "CleansedDataset", "filtered_dataset_min15.csv"),
    model_path=os.path.join(root, "disease_model"),          
    top_n=10,
    output_dir=os.path.join(root, "shap_outputs")
)

print("Top Predictions:")
for disease, prob in preds:
    print(f"{disease}: {prob:.4f}")

print("\nSHAP Explanation Graphs:")
for disease, path in graph_paths.items():
    print(f"{disease}: {path}")
