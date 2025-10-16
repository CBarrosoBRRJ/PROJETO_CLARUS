from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Clarus"
    app_env: str = "dev"
    postgres_host: str = "db"
    postgres_port: int = 5432
    postgres_user: str = "clarus"
    postgres_password: str = "clarus"
    postgres_db: str = "clarus"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()