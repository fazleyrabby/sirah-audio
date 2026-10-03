from google.cloud import texttospeech

client = texttospeech.TextToSpeechClient()
voices = client.list_voices()
for voice in voices.voices:
    if "bn" in voice.name.lower() or "bn" in voice.language_codes[0].lower():
        print(f"Name: {voice.name}, Gen: {voice.ssml_gender}, Lang: {voice.language_codes}")
