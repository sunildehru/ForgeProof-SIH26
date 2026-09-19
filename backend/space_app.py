import os

try:
    import gradio as gr
except ImportError:
    gr = None

from app.main import app as fastapi_app

if gr is not None:
    with gr.Blocks(title="ForgeProof Forensic AI Engine") as demo:
        gr.Markdown("# 🛡️ ForgeProof Forensic Verification API")
        gr.Markdown(
            "Real-time biometric and document forensic screening engine powered by FastAPI & PyTorch.\n\n"
            "- **Interactive API Docs**: [OpenAPI Swagger UI](/docs)\n"
            "- **Forensic Screening Endpoint**: `POST /api/v1/cases/screen`\n"
            "- **Cryptographic Audit Ledger**: `GET /api/v1/audit`\n"
            "- **Officer Authentication**: `POST /api/v1/auth/login`"
        )
        with gr.Row():
            gr.Label(value="Operational", label="Service Status")
            gr.Label(value="2 vCPU • 16 GB RAM (Free Tier)", label="Compute Tier")

    app = gr.mount_gradio_app(fastapi_app, demo, path="/")
else:
    app = fastapi_app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
