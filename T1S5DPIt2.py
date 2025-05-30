import pandas as pd
import numpy as np
import random
from collections import defaultdict
from S5DiseasePredictIteration2 import XGBoostDiseasePredictor

def evaluate_top_n_accuracy(model_path_prefix, dataset_path, top_n=5, sample_size=100, max_per_class=3, drop_probability=0.2, false_positive_probability=0.1):
    predictor = XGBoostDiseasePredictor(model_path=model_path_prefix)
    df = pd.read_csv(dataset_path)
    diseases = df.iloc[:, 0].tolist()
    symptom_data = df.iloc[:, 1:]

    class_counts = defaultdict(int)
    valid_indices = list(range(len(df)))
    random.shuffle(valid_indices)

    selected_indices = []
    for idx in valid_indices:
        disease = diseases[idx]
        if class_counts[disease] < max_per_class:
            selected_indices.append(idx)
            class_counts[disease] += 1
        if len(selected_indices) >= sample_size:
            break

    correct = 0
    total = 0

    for idx in selected_indices:
        true_disease = diseases[idx]
        original_vector = symptom_data.iloc[idx].values.astype(float)

        noisy_vector = original_vector.copy()
        for i in range(len(noisy_vector)):
            if noisy_vector[i] == 1 and random.random() < drop_probability:
                noisy_vector[i] = 0  # Forgetting symptom
            elif noisy_vector[i] == 0 and random.random() < false_positive_probability:
                noisy_vector[i] = 1  # Misreported symptom

        predictions = predictor.predict_top_n(noisy_vector, top_n=top_n)
        predicted_diseases = [d for d, _ in predictions]

        if true_disease in predicted_diseases:
            correct += 1
        total += 1

    accuracy = correct / total
    print(f"Top-{top_n} Accuracy on {total} noisy samples (max {max_per_class} per class):")
    print(f"  • Dropout: {int(drop_probability*100)}% | False positives: {int(false_positive_probability*100)}%")
    print(f"  • Accuracy: {accuracy:.2%}")
    return accuracy

if __name__ == "__main__":
    evaluate_top_n_accuracy(
        model_path_prefix="disease_model",
        dataset_path="/Users/visheshgoyal/NeuroMechs/CleansedDataset/filtered_dataset_min15.csv",
        top_n=5,
        sample_size=4000,
        max_per_class=6,
        drop_probability=0.3,
        false_positive_probability=0
    )