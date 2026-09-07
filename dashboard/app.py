from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EV Charging RL API",
    description="Backend API for RL-based EV charging load balancing"
)

# Allow the Next.js frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "EV Charging RL Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EV Charging RL Backend"
    }