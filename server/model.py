"""
This module uses the Hugging Face transformers library to perform sentiment analysis
with the 'tabularisai/multilingual-sentiment-analysis' model.
"""

from typing import List
from transformers import pipeline

# Initialize the sentiment analysis pipeline once when the module is loaded.
# The model will be downloaded from Hugging Face on the first run.
try:
    print("Loading sentiment analysis model... (This may take a while on first run)")
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="tabularisai/multilingual-sentiment-analysis"
    )
    print("Sentiment analysis model loaded successfully.")
except Exception as e:
    print(f"Error loading Hugging Face model: {e}")
    sentiment_pipeline = None

def predict_labels(texts: List[str]) -> List[str]:
    """
    Analyzes a list of texts and returns a list of sentiment labels (e.g., 'Positive').
    """
    if not sentiment_pipeline:
        print("Sentiment pipeline not available. Returning neutral labels.")
        return ["Neutral"] * len(texts)

    if not isinstance(texts, list) or not texts:
        return []

    try:
        print(f"Analyzing {len(texts)} texts with Hugging Face model...")
        results = sentiment_pipeline(texts)
        print(f"Raw model results: {results}")

        # Extract the label string from each result
        labels = [res['label'] for res in results]
        return labels
    except Exception as e:
        print(f"Error during sentiment analysis pipeline: {e}")
        # Return neutral labels for all texts in case of an error
        return ["Neutral"] * len(texts)