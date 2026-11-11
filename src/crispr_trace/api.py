"""FastAPI service for the CRISPR-Trace web frontend."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


def main() -> None:
    import uvicorn

    uvicorn.run("crispr_trace.api:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
