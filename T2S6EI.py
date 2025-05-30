import os
from S6ExplainIt import predict_and_explain_top_n

root = os.path.dirname(os.path.abspath(__file__))

# Run prediction + explanation
preds, graph_paths = predict_and_explain_top_n(
    json_path=os.path.join(root, "temp.json"),
    dataset_path=os.path.join(root, "CleansedDataset", "filtered_dataset_min15.csv"),     # replace with actual dataset path
    model_path=os.path.join(root, "disease_model"),          # replace if your model has a different name
    top_n=10,
    output_dir=os.path.join(root, "shap_outputs")
)

# Print predictions
print("Top Predictions:")
for disease, prob in preds:
    print(f"{disease}: {prob:.4f}")

# Print paths to SHAP graphs
print("\nSHAP Explanation Graphs:")
for disease, path in graph_paths.items():
    print(f"{disease}: {path}")
