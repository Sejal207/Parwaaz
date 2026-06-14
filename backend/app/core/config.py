from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    UPLOAD_DIR: str = "uploads"
    REFERENCE_DIR: str = "references"
    MAX_FILE_SIZE_MB: int = 100
    WHISPER_MODEL: str = "small"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

# Ensure directories exist at startup
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
Path(settings.REFERENCE_DIR).mkdir(exist_ok=True)