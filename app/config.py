from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ainative_base_url: str = "https://api.ainative.studio"
    ainative_api_key: str = ""
    zerodb_base_url: str = "https://api.ainative.studio/api/v1"
    zerodb_api_key: str = ""
    project_id: str = ""
    jwt_secret: str = "sc-builders-ws-token-secret"
    ws_token_ttl_seconds: int = 900
    tenant_name: str = "santa-cruz-builders"
    cors_origins: str = "http://localhost:3000,https://sc-builders.ainative.studio,https://scbuilders.com"
    rate_limit_default: str = "100/minute"
    rate_limit_auth: str = "5/minute"
    rate_limit_channel_create: str = "10/minute"
    rate_limit_ws_token: str = "10/minute"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
