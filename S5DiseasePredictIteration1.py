import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class ConfidenceAwareDiseasePredictor:
    def __init__(self, feature_map_path):
        self.df = pd.read_csv(feature_map_path)
        self.diseases = self.df['Disease'].tolist()
        self.symptoms = self.df.columns.tolist()[1:]  
        self.feature_matrix = self.df[self.symptoms].values  

    def _create_weighted_input_vector(self, symptom_confidence_dict):
        input_vector = np.zeros(len(self.symptoms))
        for i, symptom in enumerate(self.symptoms):
            confidence = symptom_confidence_dict.get(symptom, 0.0)
            input_vector[i] = confidence  
        return input_vector

    def predict(self, symptom_confidence_dict, top_n=3):
        input_vector = self._create_weighted_input_vector(symptom_confidence_dict).reshape(1, -1)
        similarities = cosine_similarity(self.feature_matrix, input_vector).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_n]

        results = [(self.diseases[i], round(similarities[i], 5)) for i in top_indices]
        return results

if __name__ == "__main__":
    predictor = ConfidenceAwareDiseasePredictor("/Users/visheshgoyal/NeuroMechs/CleansedDataset/symptomMap.csv")

    input_symptoms = {
        'constipation' : 0.8,
        'abdominal_distention' : 0.8,
        'lower_abdominal_pain' : 0.8
    }
    predictions = predictor.predict(input_symptoms, top_n=10)

    print("🔍 Predicted Diseases (with similarity scores):")
    for disease, score in predictions:
        print(f"{disease} → Score: {score}")