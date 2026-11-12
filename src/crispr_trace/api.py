"""FastAPI service for the CRISPR-Trace web frontend."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.staticfiles import StaticFiles

from .scanner import analyze_sequence


class AnalysisRequest(BaseModel):
    target_dna: str
    guide_rna: str


app = FastAPI(
    title="CRISPR-Trace API",
    version="0.1.0",
    description="Analyze potential SpCas9 off-target sites.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

WEB_DIR = Path(__file__).resolve().parents[2] / "web"


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "crispr-trace-api"}


@app.post("/api/analyze")
def analyze(request: AnalysisRequest) -> dict:
    try:
        results = analyze_sequence(request.target_dna, request.guide_rna)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return {
        "candidate_count": len(results),
        "results": results,
    }


@app.get("/", include_in_schema=False)
def website() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


app.mount("/", StaticFiles(directory=WEB_DIR), name="website")


def main() -> None:
    import uvicorn

    uvicorn.run("crispr_trace.api:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
