from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, access, contact

app = FastAPI()

# Ajuste as origens conforme seu front (adicione outras se necessário)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # <- IMPORTANTE para cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(access.router)
app.include_router(contact.router)


