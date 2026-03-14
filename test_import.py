try:
    import whisper
    print("Whisper imported successfully")
    
    # Test if we can load the model
    model = whisper.load_model("base")
    print("Model loaded successfully")
    
except Exception as e:
    print(f"Error: {e}")
    print(f"Error type: {type(e)}")