import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Load cleaned dataset
df = pd.read_csv("lifi_ml_dataset.csv")


# Features available before execution
features = [
    "provider",
    "source_chain",
    "destination_chain",
    "source_token",
    "destination_token",
    "amount_usd",
]


target = "latency_seconds"


# Remove incomplete rows
df = df.dropna(
    subset=features + [target]
)


X = df[features]
y = df[target]


# Categorical features
categorical_features = [
    "provider",
    "source_token",
    "destination_token",
]


# Numerical features
numerical_features = [
    "source_chain",
    "destination_chain",
    "amount_usd",
]


# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features,
        ),
        (
            "numerical",
            "passthrough",
            numerical_features,
        ),
    ]
)


# Random Forest regression model
model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    min_samples_leaf=2,
)


# Complete pipeline
pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)


# Train
pipeline.fit(
    X_train,
    y_train
)


# Predict
predictions = pipeline.predict(
    X_test
)


# Evaluation
mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5

r2 = r2_score(
    y_test,
    predictions
)


print("======================================")
print("ROUTEX Latency Prediction Model")
print("======================================")

print(
    f"Dataset size: {len(df)}"
)

print(
    f"Training samples: {len(X_train)}"
)

print(
    f"Testing samples: {len(X_test)}"
)

print(
    f"MAE: {mae:.2f} seconds"
)

print(
    f"RMSE: {rmse:.2f} seconds"
)

print(
    f"R² Score: {r2:.3f}"
)

print("======================================")


# Show predictions
results = pd.DataFrame(
    {
        "actual_latency": y_test.values,
        "predicted_latency": predictions,
    }
)

print("\nSample Predictions:")
print(
    results.head(15).to_string(
        index=False
    )
)