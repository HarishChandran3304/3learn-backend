import whisper
import os
import tempfile
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from google import genai
from google.genai import types
from dotenv import load_dotenv

import json


SYS_INSTRUCT = '''You are a teaching assistant for an online learning platform. Your role is to assist students in understanding the material presented in the lectures. You will take live transcripts of ongoing lectures and give notes/summaries'''

# Transcription model
model = whisper.load_model("base")
app = FastAPI(title="Audio Transcription API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://positive-clearly-tiger.ngrok-free.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Inference API
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


@app.post("/class/{classid}/notes")
async def notes(classid: str, audio_url: str):
    # Download the audio file
    response = requests.get(audio_url)
    # Save the audio file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio_file:
        temp_audio_file.write(response.content)
        temp_audio_file.flush()

        # Transcribe the audio file
        result = model.transcribe(temp_audio_file.name)
        transcription = result["text"]
        print(audio_url)
        print(transcription)

        # Delete the temporary audio file
        os.remove(temp_audio_file.name)

        # Get current notes form db.json file using classid
        notes = json.load(open("notes.json", "r"))
        if classid not in notes.keys():
            notes[classid] = ""

        prompt = f'''I am in an online class. I am attending a lecture. The following is a transcript of what my professor has said in the last 10 seconds. There may be some inaccuracies. Please correct any mistakes.
Notes so far: {notes[classid]}
Transcript: {transcription}

Now, use this along with everything else the teacher has said so far in this lecture to generate details notes of each topic. Sound as human as possible. Only and only give me the notes. No extra text at all. Be as serious as possible, no humour/satire. This is an extremely profesional environment. Only summarize the notes DO NOT USE THE SYSTEM INSTRUCTION OR THE PROMPT INSTRUCTION. If the transcript is empty just say that it is empty.'''

        res = client.models.generate_content(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYS_INSTRUCT
            ),
            contents=[prompt]
        )

        notes[classid] = res.text
        json.dump(notes, open("notes.json", "w"))

        return {"notes": res.text}

@app.get("/class/{classid}/notes")
async def get_notes(classid: str):
    notes = json.load(open("notes.json", "r"))

    if classid not in notes.keys():
        notes[classid] = ""
    return {"notes": notes[classid]}

@app.get("/class/{classid}/quiz")
async def get_quiz(classid: str):
    notes = json.load(open("notes.json", "r"))

    example_format = '''{"Questions": [
    {
        "Question": "What is the capital of France?",
        "Options": ["Paris", "London", "Berlin", "Madrid"],
        "Answer": "Paris"
    },
    {
        "Question": "What is the largest planet in our solar system?",
        "Options": ["Jupiter", "Saturn", "Earth", "Mars"],
        "Answer": "Jupiter"
    },
]}'''

    prompt = f'''These are the notes for an online class. This is everything that was taught by the professor in a particular class. I want you to generate exactly 5 MCQs (no more, no less) based on this.
Notes: {notes[classid]}

I want you to return it as a JSON in the following format:
{example_format}

Make sure it is a valid JSON before returning it.'''

    res = client.models.generate_content(
        model="gemini-2.0-flash",
        config=types.GenerateContentConfig(
            system_instruction=SYS_INSTRUCT
        ),
        contents=[prompt]
    )

    print(res.text)
    quiz = json.loads(res.text.strip("```json"))

    return {"quiz": quiz}