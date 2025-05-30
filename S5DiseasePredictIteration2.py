import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight

class XGBoostDiseasePredictor:
    def __init__(self, model_path=None):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.symptom_names = []
        self.num_classes = 0

        if model_path:
            self.load(model_path)

    def load_and_prepare_data(self, csv_path):
        df = pd.read_csv(csv_path)

        y = df.iloc[:, 0]
        X = df.iloc[:, 1:]
        self.symptom_names = X.columns.tolist()

        y_encoded = self.label_encoder.fit_transform(y)
        self.num_classes = len(self.label_encoder.classes_)

        class_weights = compute_class_weight('balanced', classes=np.unique(y_encoded), y=y_encoded)
        weight_dict = dict(zip(np.unique(y_encoded), class_weights))
        sample_weights = np.array([weight_dict[label] for label in y_encoded])

        X_train, X_test, y_train, y_test, sw_train, sw_test = train_test_split(
            X, y_encoded, sample_weights, test_size=0.2, random_state=42, stratify=y_encoded
        )

        return X_train, X_test, y_train, y_test, sw_train, sw_test

    def train(self, X_train, y_train, sample_weights):
        self.model = xgb.XGBClassifier(
            objective='multi:softprob',
            num_class=self.num_classes,
            eval_metric='mlogloss',
            use_label_encoder=False,
            max_depth=6,
            learning_rate=0.1,
            n_estimators=100
        )
        self.model.fit(X_train, y_train, sample_weight=sample_weights)

    def predict_top_n(self, input_vector, top_n=10):
        if self.model is None:
            raise ValueError("Model not trained or loaded.")

        input_vector = np.array(input_vector).reshape(1, -1)
        probs = self.model.predict_proba(input_vector)[0]
        top_indices = np.argsort(probs)[::-1][:top_n]
        return [(self.label_encoder.inverse_transform([i])[0], round(probs[i], 5)) for i in top_indices]

    def get_symptom_index(self, symptom_name):
        return self.symptom_names.index(symptom_name) if symptom_name in self.symptom_names else -1

    def get_symptom_template(self):
        return {symptom: 0.0 for symptom in self.symptom_names}

    def save(self, model_path_prefix):
        """
        Saves the trained model, label encoder, and symptom list.
        """
        if self.model is None:
            raise ValueError("No trained model to save.")
        self.model.save_model(f"{model_path_prefix}_model.json")
        with open(f"{model_path_prefix}_meta.pkl", 'wb') as f:
            pickle.dump({
                'label_encoder': self.label_encoder,
                'symptom_names': self.symptom_names
            }, f)

    def load(self, model_path_prefix):
        """
        Loads model, label encoder, and symptoms from disk.
        """
        self.model = xgb.XGBClassifier()
        self.model.load_model(f"{model_path_prefix}_model.json")
        with open(f"{model_path_prefix}_meta.pkl", 'rb') as f:
            meta = pickle.load(f)
            self.label_encoder = meta['label_encoder']
            self.symptom_names = meta['symptom_names']
            self.num_classes = len(self.label_encoder.classes_)

if __name__ == "__main__":
    # model = XGBoostDiseasePredictor()

    # X_train, X_test, y_train, y_test, sw_train, sw_test = model.load_and_prepare_data("/Users/visheshgoyal/NeuroMechs/CleansedDataset/filtered_dataset_min15.csv")
    # model.train(X_train, y_train, sw_train)
    # model.save("disease_model")  # Saves: disease_model_model.json + disease_model_meta.pkl

    # input_symptoms = model.get_symptom_template()
    # input_symptoms['fever'] = 0.8
    # input_symptoms['cough'] = 0.9
    # input_vector = list(input_symptoms.values())
    # preds = model.predict_top_n(input_vector)
    # print("Top predictions:", preds)

    new_model = XGBoostDiseasePredictor("disease_model")
    input_symptoms = new_model.get_symptom_template()
    input_symptoms['fever'] = 1
    input_symptoms['cough'] = 1
    input_vector = list(input_symptoms.values())
    print("From loaded model:", new_model.predict_top_n(input_vector))
