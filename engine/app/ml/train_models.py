import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import (
    RandomForestRegressor,
    ExtraTreesRegressor,
    GradientBoostingRegressor
)
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


DATASET_FILE = "lifi_ml_dataset.csv"
MODEL_DIRECTORY = "app/ml/saved_models"

TEST_SIZE = 0.20
RANDOM_STATE = 42


FEATURES = [
    "provider",
    "route",
    "token_pair",
    "source_chain",
    "destination_chain",
    "amount_usd",
    "log_amount_usd",
    "hour",
    "day_of_week"
]


CATEGORICAL_FEATURES = [
    "provider",
    "route",
    "token_pair"
]


NUMERICAL_FEATURES = [
    "source_chain",
    "destination_chain",
    "amount_usd",
    "log_amount_usd",
    "hour",
    "day_of_week"
]


def main():

    print("=" * 65)
    print("ROUTEX ML TRAINING")
    print("=" * 65)

    df = pd.read_csv(DATASET_FILE)

    print(f"\nDataset loaded: {len(df):,} records")

    # --------------------------------------------------------
    # NUMERIC CONVERSION
    # --------------------------------------------------------

    numeric_columns = [
        "source_chain",
        "destination_chain",
        "amount_usd",
        "source_gas_used",
        "destination_gas_used",
        "source_gas_cost_usd",
        "destination_gas_cost_usd",
        "latency_seconds"
    ]

    for column in numeric_columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    # --------------------------------------------------------
    # FEATURE ENGINEERING
    # --------------------------------------------------------

    df["route"] = (
        df["source_chain"].astype(str)
        + "_"
        + df["destination_chain"].astype(str)
    )

    df["token_pair"] = (
        df["source_token"].fillna("UNKNOWN")
        + "_"
        + df["destination_token"].fillna("UNKNOWN")
    )

    df["log_amount_usd"] = (
        __import__("numpy")
        .log1p(
            df["amount_usd"].clip(lower=0)
        )
    )

    timestamp = pd.to_datetime(
        df["timestamp"],
        unit="s",
        errors="coerce"
    )

    df["hour"] = timestamp.dt.hour
    df["day_of_week"] = timestamp.dt.dayofweek

    # --------------------------------------------------------
    # TARGETS
    # --------------------------------------------------------

    df["total_cost_usd"] = (
        df["source_gas_cost_usd"]
        + df["destination_gas_cost_usd"]
    )

    df["total_gas_used"] = (
        df["source_gas_used"]
        + df["destination_gas_used"]
    )

    # --------------------------------------------------------
    # CLEAN
    # --------------------------------------------------------

    targets = [
        "latency_seconds",
        "total_cost_usd",
        "total_gas_used"
    ]

    df = df.dropna(
        subset=FEATURES + targets
    )

    df = df[
        df["amount_usd"] >= 0
    ]

    df = df[
        df["latency_seconds"] >= 0
    ]

    df = df[
        df["total_cost_usd"] >= 0
    ]

    df = df[
        df["total_gas_used"] >= 0
    ]

    print(
        f"Records after cleaning: {len(df):,}"
    )

    # --------------------------------------------------------
    # CLIP EXTREME TARGETS
    # --------------------------------------------------------

    for target in targets:

        upper_limit = df[target].quantile(0.99)

        df[target] = df[target].clip(
            upper=upper_limit
        )

    print(
        "Extreme target values clipped "
        "at the 99th percentile."
    )

    # --------------------------------------------------------
    # MODELS
    # --------------------------------------------------------

    models = {

        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            min_samples_leaf=3,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),

        "Extra Trees": ExtraTreesRegressor(
            n_estimators=300,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),

        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=4,
            min_samples_leaf=5,
            random_state=RANDOM_STATE
        )
    }

    targets_config = {
        "latency_seconds": "latency_model.pkl",
        "total_cost_usd": "cost_model.pkl",
        "total_gas_used": "gas_model.pkl"
    }

    all_results = {}

    # --------------------------------------------------------
    # TRAIN EACH TARGET
    # --------------------------------------------------------

    for target, filename in targets_config.items():

        print("\n" + "=" * 65)
        print(f"TARGET: {target}")
        print("=" * 65)

        X = df[FEATURES]
        y = df[target]

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE
        )

        results = []

        best_pipeline = None
        best_r2 = float("-inf")
        best_name = None

        for model_name, model in models.items():

            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "categorical",
                        OneHotEncoder(
                            handle_unknown="ignore"
                        ),
                        CATEGORICAL_FEATURES
                    ),
                    (
                        "numerical",
                        "passthrough",
                        NUMERICAL_FEATURES
                    )
                ]
            )

            pipeline = Pipeline(
                steps=[
                    (
                        "preprocessor",
                        preprocessor
                    ),
                    (
                        "model",
                        model
                    )
                ]
            )

            pipeline.fit(
                X_train,
                y_train
            )

            predictions = pipeline.predict(
                X_test
            )

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

            print(f"\n{model_name}")
            print(f"MAE  : {mae:.4f}")
            print(f"RMSE : {rmse:.4f}")
            print(f"R²   : {r2:.4f}")

            results.append({
                "model": model_name,
                "MAE": mae,
                "RMSE": rmse,
                "R2": r2
            })

            if r2 > best_r2:

                best_r2 = r2
                best_pipeline = pipeline
                best_name = model_name

        # ----------------------------------------------------
        # SAVE BEST MODEL
        # ----------------------------------------------------

        os.makedirs(
            MODEL_DIRECTORY,
            exist_ok=True
        )

        model_path = os.path.join(
            MODEL_DIRECTORY,
            filename
        )

        joblib.dump(
            best_pipeline,
            model_path
        )

        print("\nBEST MODEL")
        print(
            f"Model : {best_name}"
        )

        print(
            f"R²    : {best_r2:.4f}"
        )

        print(
            f"Saved : {model_path}"
        )

        all_results[target] = results

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    print("\n")
    print("=" * 65)
    print("ROUTEX FINAL RESULTS")
    print("=" * 65)

    for target, results in all_results.items():

        print(f"\n{target}")

        print(
            pd.DataFrame(results)
            .to_string(index=False)
        )

    print("\n" + "=" * 65)
    print("TRAINING COMPLETE")
    print("=" * 65)


if __name__ == "__main__":
    main()