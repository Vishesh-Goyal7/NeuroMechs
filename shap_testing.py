import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import shap
import matplotlib.pyplot as plt

# Set target column (user input)
target_column = input("Enter the target column name (e.g., depression): ").strip()

# Load the dataset
df = pd.read_csv("mini.csv")

# Ensure the target column is integer
df[target_column] = df[target_column].astype(int)

# Drop non-feature columns (assume 'Disease' and target are non-features)
X = df.drop(columns=["Disease", target_column])
y = df[target_column]

# Split into train and test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train the model
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

print("X_test shape:", X_test.shape)
print("shap_values shape:", shap_values.shape)  # New: expect (samples, features, classes)

shap_class1 = shap_values[:, :, 1]

print("shap_class1 shape:", shap_class1.shape)

# Plot SHAP summary for class 1 and save to file
plt.figure()
shap.summary_plot(shap_class1, X_test, show=False)
plt.title("SHAP Summary Plot", fontsize=16)
plt.tight_layout()
plt.savefig("shap_summary_plot.png", dpi=300, bbox_inches='tight')
plt.show()