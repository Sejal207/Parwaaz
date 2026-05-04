# AI Performing Arts Coach

This project is a web application designed to provide AI-powered feedback to performing artists, including actors, public speakers, and singers. Users can upload a video of their performance and receive a multimodal analysis covering speech, facial expressions, and vocal pitch.

## Tech Stack

The application is a monorepo composed of a Python backend and a React frontend.

### Backend

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/)
*   **Database Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
*   **AI / Machine Learning:**
    *   **Speech-to-Text:** OpenAI Whisper
    *   **Pronunciation Scoring:** Cosine similarity with `sentence-transformers`
    *   **Facial Expression Recognition:** PyTorch (CNN model)
    *   **Computer Vision:** OpenCV
    *   **Audio Processing:** Librosa

### Frontend

*   **Framework:** [React](https://reactjs.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **HTTP Client:** [Axios](https://axios-http.com/)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **Charting:** [Recharts](https://recharts.org/)

## Project Structure

```
.
├── backend/      # FastAPI application, AI modules, database models
├── frontend/     # React application, components, and pages
└── uploads/      # Directory where user-uploaded videos are stored
```

## Setup and Installation

### Prerequisites

*   Python 3.10+
*   Node.js 16+
*   npm
*   A running PostgreSQL instance

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure the database:**
    The application expects a PostgreSQL database. The connection string is configured in `backend/app/core/config.py`. You may need to create a `.env` file or modify the configuration to point to your database.

5.  **Run database migrations:**
    Alembic is used to manage the database schema. To apply all migrations, run:
    ```bash
    alembic upgrade head
    ```

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the required npm packages:**
    ```bash
    npm install
    ```

## Running the Application

Both the backend and frontend servers need to be running concurrently.

1.  **Start the backend server:**
    From the `backend` directory, with your virtual environment activated, run:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`.

2.  **Start the frontend development server:**
    From the `frontend` directory, run:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## How to Use

1.  **Open the application** in your browser.
2.  **Select an analysis module** (Speech, Facial, Pitch, or Full).
3.  **Provide mission data**, including a title and an optional reference script.
4.  **Upload your performance video**.
5.  **Launch the analysis** and wait for the AI models to process the video.
6.  **View the results** on the report page, which provides detailed feedback and visualizations.
7.  **View past sessions** on the history page.
