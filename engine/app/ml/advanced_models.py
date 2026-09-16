import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor


DATASET_FILE = "lifi_ml_dataset.csv"
MODEL_DIRECTORY = "app/ml/saved_models"

TEST_SIZE = 0.20
RANDOM_STATE = 42


print("=" * 70)
print("ROUTEX IMPROVED COST + GAS MODELS")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATASET_FILE)

print(f"\nDataset: {len(df):,} records")


# ============================================================
# NUMERIC CONVERSION
# ============================================================

numeric_columns = [
    "source_chain",
    "destination_chain",
    "amount_usd",
    "source_gas_used",
    "destination_gas_used",
    "source_gas_cost_usd",
    "destination_gas_cost_usd",
    "latency_seconds",
    "timestamp",
]

for column in numeric_columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")


# ============================================================
# FEATURE ENGINEERING
# ============================================================

df["route"] = (
    df["source_chain"].astype(str)
    + "_"
    + df["destination_chain"].astype(str)
)

df["token_pair"] = (
    df["source_token"].fillna("UNKNOWN").astype(str)
    + "_"
    + df["destination_token"].fillna("UNKNOWN").astype(str)
)

df["log_amount"] = np.log1p(
    df["amount_usd"].clip(lower=0)
)

df["amount_bucket"] = pd.cut(
    df["amount_usd"],
    bins=[
        -1,
        10,
        100,
        1000,
        10000,
        100000,
        np.inf,
    ],
    labels=[
        "tiny",
        "small",
        "medium",
        "large",
        "very_large",
        "huge",
    ]
)

timestamp_dt = pd.to_datetime(
    df["timestamp"],
    unit="s",
    errors="coerce"
)

df["hour"] = timestamp_dt.dt.hour
df["day_of_week"] = timestamp_dt.dt.dayofweek


# ============================================================
# TARGETS
# ============================================================

df["total_cost_usd"] = (
    df["source_gas_cost_usd"]
    + df["destination_gas_cost_usd"]
)

df["total_gas_used"] = (
    df["source_gas_used"]
    + df["destination_gas_used"]
)


# ============================================================
# CLEANING
# ============================================================

features = [
    "provider",
    "route",
    "token_pair",
    "source_chain",
    "destination_chain",
    "source_token",
    "destination_token",
    "amount_usd",
    "log_amount",
    "amount_bucket",
    "hour",
    "day_of_week",
]

targets = [
    "total_cost_usd",
    "total_gas_used",
]

df = df.dropna(
    subset=features + targets
)

df = df[
    (df["amount_usd"] >= 0)
    & (df["total_cost_usd"] >= 0)
    & (df["total_gas_used"] >= 0)
]

print(f"Records after cleaning: {len(df):,}")


# ============================================================
# TARGET CLIPPING
# ============================================================

for target in targets:

    upper = df[target].quantile(0.99)

    print(
        f"{target} 99th percentile: {upper:.4f}"
    )

    df[target] = df[target].clip(
        upper=upper
    )


# ============================================================
# FEATURES
# ============================================================

categorical_features = [
    "provider",
    "route",
    "token_pair",
    "source_token",
    "destination_token",
    "amount_bucket",
]

numerical_features = [
    "source_chain",
    "destination_chain",
    "amount_usd",
    "log_amount",
    "hour",
    "day_of_week",
]


X = df[features]


train_indices, test_indices = train_test_split(
    df.index,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
)


X_train = df.loc[
    train_indices,
    features
]

X_test = df.loc[
    test_indices,
    features
]


# ============================================================
# PREPROCESSOR
# ============================================================

def create_preprocessor():

    return ColumnTransformer(
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


# ============================================================
# XGBOOST
# ============================================================

def create_xgb():

    return XGBRegressor(
        n_estimators=800,
        max_depth=6,
        learning_rate=0.025,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        reg_alpha=0.05,
        reg_lambda=1.0,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )


# ============================================================
# PRACTICAL ACCURACY
# ============================================================

def practical_accuracy(actual, predicted):

    actual = np.asarray(actual)
    predicted = np.asarray(predicted)

    mask = actual > 0

    actual = actual[mask]
    predicted = predicted[mask]

    percentage_error = (
        np.abs(predicted - actual)
        / actual
    )

    accuracy_10 = np.mean(
        percentage_error <= 0.10
    ) * 100

    accuracy_20 = np.mean(
        percentage_error <= 0.20
    ) * 100

    accuracy_30 = np.mean(
        percentage_error <= 0.30
    ) * 100

    return (
        accuracy_10,
        accuracy_20,
        accuracy_30,
    )


# ============================================================
# TRAIN + EVALUATE
# ============================================================

def evaluate_target(target):

    print("\n")
    print("=" * 70)
    print(f"TARGET: {target}")
    print("=" * 70)

    y_train = df.loc[
        train_indices,
        target
    ]

    y_test = df.loc[
        test_indices,
        target
    ]


    # --------------------------------------------------------
    # RAW TARGET MODEL
    # --------------------------------------------------------

    print("\nRAW TARGET XGBOOST")

    raw_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                create_preprocessor()
            ),
            (
                "model",
                create_xgb()
            ),
        ]
    )

    raw_pipeline.fit(
        X_train,
        y_train
    )

    raw_predictions = raw_pipeline.predict(
        X_test
    )

    raw_predictions = np.maximum(
        raw_predictions,
        0
    )


    raw_mae = mean_absolute_error(
        y_test,
        raw_predictions
    )

    raw_rmse = mean_squared_error(
        y_test,
        raw_predictions
    ) ** 0.5

    raw_r2 = r2_score(
        y_test,
        raw_predictions
    )

    raw_a10, raw_a20, raw_a30 = (
        practical_accuracy(
            y_test,
            raw_predictions
        )
    )


    print(f"MAE       : {raw_mae:.6f}")
    print(f"RMSE      : {raw_rmse:.6f}")
    print(f"R²        : {raw_r2:.6f}")
    print(f"±10%      : {raw_a10:.2f}%")
    print(f"±20%      : {raw_a20:.2f}%")
    print(f"±30%      : {raw_a30:.2f}%")


    # --------------------------------------------------------
    # LOG TARGET MODEL
    # --------------------------------------------------------

    print("\nLOG TARGET XGBOOST")

    y_train_log = np.log1p(
        y_train
    )

    log_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                create_preprocessor()
            ),
            (
                "model",
                create_xgb()
            ),
        ]
    )

    log_pipeline.fit(
        X_train,
        y_train_log
    )

    log_predictions = log_pipeline.predict(
        X_test
    )

    log_predictions = np.expm1(
        log_predictions
    )

    log_predictions = np.maximum(
        log_predictions,
        0
    )


    log_mae = mean_absolute_error(
        y_test,
        log_predictions
    )

    log_rmse = mean_squared_error(
        y_test,
        log_predictions
    ) ** 0.5

    log_r2 = r2_score(
        y_test,
        log_predictions
    )

    log_a10, log_a20, log_a30 = (
        practical_accuracy(
            y_test,
            log_predictions
        )
    )


    print(f"MAE       : {log_mae:.6f}")
    print(f"RMSE      : {log_rmse:.6f}")
    print(f"R²        : {log_r2:.6f}")
    print(f"±10%      : {log_a10:.2f}%")
    print(f"±20%      : {log_a20:.2f}%")
    print(f"±30%      : {log_a30:.2f}%")


    # --------------------------------------------------------
    # SELECT BEST MODEL
    # --------------------------------------------------------

    print("\nBEST MODEL")

    if log_r2 > raw_r2:

        best_model = log_pipeline
        best_name = "XGBoost + Log Target"
        best_r2 = log_r2
        best_mae = log_mae
        best_predictions = log_predictions

    else:

        best_model = raw_pipeline
        best_name = "XGBoost + Raw Target"
        best_r2 = raw_r2
        best_mae = raw_mae
        best_predictions = raw_predictions


    a10, a20, a30 = practical_accuracy(
        y_test,
        best_predictions
    )


    print(f"Model     : {best_name}")
    print(f"R²        : {best_r2:.6f}")
    print(f"MAE       : {best_mae:.6f}")
    print(f"±10%      : {a10:.2f}%")
    print(f"±20%      : {a20:.2f}%")
    print(f"±30%      : {a30:.2f}%")


    return (
        best_model,
        best_name,
        best_r2,
        best_mae,
        a10,
        a20,
        a30,
    )


# ============================================================
# TRAIN BOTH
# ============================================================

cost_result = evaluate_target(
    "total_cost_usd"
)

gas_result = evaluate_target(
    "total_gas_used"
)


# ============================================================
# SAVE MODELS
# ============================================================

os.makedirs(
    MODEL_DIRECTORY,
    exist_ok=True
)


joblib.dump(
    cost_result[0],
    os.path.join(
        MODEL_DIRECTORY,
        "cost_model.pkl"
    )
)

joblib.dump(
    gas_result[0],
    os.path.join(
        MODEL_DIRECTORY,
        "gas_model.pkl"
    )


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FINAL IMPROVED MODEL RESULTS")
print("=" * 70)

print("\nCOST")
print(f"Best model : {cost_result[1]}")
print(f"R²         : {cost_result[2]:.6f}")
print(f"MAE        : ${cost_result[3]:.6f}")
print(f"±10%       : {cost_result[4]:.2f}%")
print(f"±20%       : {cost_result[5]:.2f}%")
print(f"±30%       : {cost_result[6]:.2f}%")

print("\nGAS")
print(f"Best model : {gas_result[1]}")
print(f"R²         : {gas_result[2]:.6f}")
print(f"MAE        : {gas_result[3]:.2f} gas")
print(f"±10%       : {gas_result[4]:.2f}%")
print(f"±20%       : {gas_result[5]:.2f}%")
print(f"±30%       : {gas_result[6]:.2f}%")

print("\n")
print("=" * 70)
print("MODELS SAVED")
print("=" * 70)

print(
    f"Cost → {MODEL_DIRECTORY}/cost_model.pkl"
)

print(
    f"Gas  → {MODEL_DIRECTORY}/gas_model.pkl"
)

print("=" * 70)